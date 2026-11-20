import * as yaml from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';
import { KubeConfig, AppsV1Api, CoreV1Api, NetworkingV1Api, BatchV1Api } from '@kubernetes/client-node';

const NAMESPACE = 'default';

/** How long a freshly created workspace pod may take to accept connections. */
const READY_TIMEOUT_MS = 120_000;

/** How long the pod of a deleted workspace may take to stop. */
const STOP_TIMEOUT_MS = 60_000;

/** How long the ingress controller may take to start routing a new sub-domain. */
const ROUTE_TIMEOUT_MS = 15_000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * True when every workspace runs in its own pod, false when a single
 * bridge/worker started by hand (`make dev-bridge`, `make dev-worker`) serves
 * them all.
 */
export const workspacesRunOnK8s = (): boolean =>
    useRuntimeConfig().public.WORKSPACE_RUNTIME === 'k8s';

/** A local cluster runs locally built images on a laptop, unlike production. */
const isLocalCluster = (): boolean => useRuntimeConfig().public.ENV === 'DEV';

const isK8sNotFound = (error: any): boolean => error?.code === 404 || error?.statusCode === 404;

export function createK8sClients() {
    const kc = new KubeConfig();

    kc.loadFromDefault();

    // Pin the cluster when asked to, so a developer whose kubectl points at another
    // cluster never gets local workspaces deployed there.
    const context = useRuntimeConfig().K8S_CONTEXT;
    if (context) {
        if (!kc.getContextObject(context)) {
            throw new Error(`Kubernetes context "${context}" not found in the kubeconfig. Is the cluster running?`);
        }
        kc.setCurrentContext(context);
    }

    return {
        appsV1Api: kc.makeApiClient(AppsV1Api),
        coreV1Api: kc.makeApiClient(CoreV1Api),
        networkingV1Api: kc.makeApiClient(NetworkingV1Api),
        batchV1Api: kc.makeApiClient(BatchV1Api),
    };
}

/**
 * Relaxes a workspace pod for a local cluster: a laptop cannot reserve the full
 * CPU and gigabyte each container is guaranteed in production.
 *
 * The image pull policy is deliberately left alone. Docker Desktop's cluster
 * resolves `latest` against the images built on this machine at every pod start,
 * whereas `IfNotPresent` would keep running the build the node saw first.
 */
function relaxForLocalCluster(manifest: any): void {
    if (manifest.kind !== 'Deployment') return;

    for (const container of manifest.spec.template.spec.containers) {
        container.resources.requests = { ...container.resources.requests, cpu: '100m', memory: '128Mi' };
    }
}

/**
 * Builds the manifests of a workspace from the `docker/service.yaml` template,
 * whose placeholders are documented at the top of that file.
 */
async function renderWorkspaceManifests(k8sName: string, subdomain: string, environment: unknown): Promise<any[]> {
    const templatePath = path.join(process.cwd(), '..', 'docker', 'service.yaml');
    const domain = useRuntimeConfig().public.WORKSPACE_DOMAIN;

    let manifests: any[];
    try {
        const template = await fs.readFile(templatePath, { encoding: 'utf8' });
        const rendered = template
            .replaceAll('service-name', k8sName)
            .replaceAll('workspace-subdomain', subdomain)
            .replaceAll('workspace-domain', domain);

        manifests = yaml.parseAllDocuments(rendered).map(doc => doc.toJSON()).filter(Boolean);
    } catch (error) {
        console.error(`[K8S] Error reading or parsing YAML file at ${templatePath}:`, error);
        throw new Error('Failed to process Kubernetes template.');
    }

    // The template names the generic worker image; a workspace with an
    // environment runs the image that has its toolchain installed.
    for (const manifest of manifests) {
        const worker = manifest.kind === 'Deployment'
            && manifest.spec.template.spec.containers.find((container: any) => container.name === 'worker');
        if (worker) worker.image = workerImage(environment);
    }

    if (isLocalCluster()) manifests.forEach(relaxForLocalCluster);
    return manifests;
}

/**
 * Deletes the Kubernetes resources of a workspace so it can be deployed from a
 * clean slate. Resources that do not exist are skipped.
 */
export async function deleteWorkspaceResources(k8sName: string): Promise<void> {
    const { appsV1Api, coreV1Api, networkingV1Api, batchV1Api } = createK8sClients();

    const deletions: [kind: string, name: string, run: (name: string) => Promise<unknown>][] = [
        ['Job', `${k8sName}-hydrator`, name => batchV1Api.deleteNamespacedJob({ name, namespace: NAMESPACE })],
        ['Deployment', k8sName, name => appsV1Api.deleteNamespacedDeployment({ name, namespace: NAMESPACE })],
        ['Service', k8sName, name => coreV1Api.deleteNamespacedService({ name, namespace: NAMESPACE })],
        ['Ingress', k8sName, name => networkingV1Api.deleteNamespacedIngress({ name, namespace: NAMESPACE })],
    ];

    for (const [kind, name, run] of deletions) {
        try {
            await run(name);
            console.log(`[K8S] Deleted existing ${kind}: ${name}`);
        } catch (error: any) {
            // A missing resource is the state we are after.
            if (!isK8sNotFound(error)) {
                console.error(`[K8S] Error deleting existing ${kind} ${name}:`, error.body || error);
            }
        }
    }

    // Deleting a Deployment only asks its pod to stop. Wait until it has, so the
    // old pod can never answer on the sub-domain while the new one is starting.
    const deadline = Date.now() + STOP_TIMEOUT_MS;
    while (Date.now() < deadline) {
        const pods = await coreV1Api.listNamespacedPod({ namespace: NAMESPACE, labelSelector: `app=${k8sName}` });
        if (pods.items.length === 0) return;
        await sleep(500);
    }
    console.warn(`[K8S] The previous pod of ${k8sName} is still stopping after ${STOP_TIMEOUT_MS / 1000}s.`);
}

/**
 * Waits until the workspace's sub-domain reaches its bridge. A running pod is not
 * enough: the ingress controller needs a moment to pick up a new Ingress, and an
 * IDE connecting in that gap is answered 503.
 *
 * Best effort: if this server cannot reach the sub-domain itself, the workspace
 * is handed over anyway and the IDE's own reconnection covers the gap.
 */
async function waitForRoute(subdomain: string): Promise<void> {
    const url = `http://${subdomain}.${useRuntimeConfig().public.WORKSPACE_DOMAIN}/health`;
    const deadline = Date.now() + ROUTE_TIMEOUT_MS;

    while (Date.now() < deadline) {
        const routed = await fetch(url, { signal: AbortSignal.timeout(2000) }).then(res => res.ok, () => false);
        if (routed) return;
        await sleep(500);
    }
    console.warn(`[K8S] ${url} did not answer within ${ROUTE_TIMEOUT_MS / 1000}s; handing the workspace over anyway.`);
}

/** Whether the pod of a workspace is up and accepting connections. */
export async function isWorkspaceRunning(k8sName: string): Promise<boolean> {
    const { appsV1Api } = createK8sClients();

    try {
        const deployment = await appsV1Api.readNamespacedDeployment({ name: k8sName, namespace: NAMESPACE });
        return (deployment.status?.availableReplicas ?? 0) >= 1;
    } catch (error) {
        if (isK8sNotFound(error)) return false;
        throw error;
    }
}

/**
 * Creates the resources of a workspace, reachable on `<subdomain>.<domain>` and
 * running the worker image of its environment, then waits until its pod accepts
 * connections, so the IDE can connect as soon as this resolves.
 */
export async function deployWorkspace(k8sName: string, subdomain: string, environment?: unknown): Promise<void> {
    const manifests = await renderWorkspaceManifests(k8sName, subdomain, environment);
    const { appsV1Api, coreV1Api, networkingV1Api, batchV1Api } = createK8sClients();

    for (const manifest of manifests) {
        if (!manifest.kind || !manifest.metadata?.name) {
            console.warn(`[K8S] Skipping invalid manifest:`, manifest);
            continue;
        }

        switch (manifest.kind) {
            case 'Job':
                await batchV1Api.createNamespacedJob({ namespace: NAMESPACE, body: manifest });
                break;
            case 'Deployment':
                await appsV1Api.createNamespacedDeployment({ namespace: NAMESPACE, body: manifest });
                break;
            case 'Service':
                await coreV1Api.createNamespacedService({ namespace: NAMESPACE, body: manifest });
                break;
            case 'Ingress':
                await networkingV1Api.createNamespacedIngress({ namespace: NAMESPACE, body: manifest });
                break;
            default:
                console.warn(`[K8S] Unsupported kind in template: ${manifest.kind}`);
                continue;
        }
        console.log(`[K8S] Created ${manifest.kind}: ${manifest.metadata.name}`);
    }

    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (!(await isWorkspaceRunning(k8sName))) {
        if (Date.now() > deadline) {
            throw new Error(`Workspace ${k8sName} was not ready after ${READY_TIMEOUT_MS / 1000}s.`);
        }
        await sleep(1000);
    }

    await waitForRoute(subdomain);
}

/**
 * Returns a workspace record whose `status` matches what is really running.
 *
 * `status` is only written when a workspace is started, so it stays `running`
 * after its pod is gone (cluster reset, `make k8s-clean`, a record last started
 * with the local runtime). The IDE relies on it to decide whether the workspace
 * has to be started, so a stale `running` would leave it connecting to nothing.
 */
export async function withLiveStatus<T extends RecordModel>(pb: PocketBase, workspace: T): Promise<T> {
    if (!workspacesRunOnK8s() || workspace.status !== 'running') return workspace;

    try {
        if (await isWorkspaceRunning(workspaceK8sName(workspace.id))) return workspace;
    } catch (error: any) {
        // Without an answer from the cluster, keep what the record says.
        console.warn(`[K8S] Could not check workspace ${workspace.id}:`, error.body || error.message || error);
        return workspace;
    }

    // Best effort: a reader who does not own the workspace may not be allowed to write it.
    await pb.collection('workspaces').update(workspace.id, { status: 'sleeping' })
        .catch(error => console.warn(`[K8S] Could not mark workspace ${workspace.id} as sleeping:`, error.message));

    return { ...workspace, status: 'sleeping' };
}
