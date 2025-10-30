import * as yaml from 'yaml';
import * as fs from 'fs/promises';
import * as path from 'path';
import { V1DeleteOptions } from '@kubernetes/client-node';

// --- HELPER FUNCTIONS ---

/**
 * Reads the YAML template file and replaces all occurrences of 'service_name'.
 * @param filePath - Path to the template file.
 * @param k8sName - The unique name for the service (e.g., 'ws-workspaceId').
 * @returns An array of parsed Kubernetes manifest objects.
 */
async function readAndParseKubeYaml(filePath: string, k8sName: string): Promise<any[]> {
    try {
        let fileContent = await fs.readFile(filePath, { encoding: 'utf8' });

        // Use a global regex to replace all occurrences of the placeholder
        const regex = new RegExp('service_name', 'g');
        fileContent = fileContent.replace(regex, k8sName);

        // Parse all documents in the YAML file
        const docs = yaml.parseAllDocuments(fileContent).map(doc => doc.toJSON());
        return docs;
    } catch (error) {
        console.error(`[K8S] Error reading or parsing YAML file at ${filePath}:`, error);
        throw new Error('Failed to process Kubernetes template.');
    }
}

/**
 * Deletes existing Kubernetes resources to ensure a clean slate for the deployment.
 * It gracefully handles 'Not Found' errors.
 */
async function deleteExistingResources(k8sName: string, namespace: string): Promise<void> {
    const { appsV1Api, coreV1Api, networkingV1Api, batchV1Api } = createK8sClients();
    const deleteOptions: V1DeleteOptions = {}; // Default propagation policy is Background

    const resources = [
        { kind: 'Job', api: batchV1Api, deleter: batchV1Api.deleteNamespacedJob.bind(batchV1Api) },
        { kind: 'Deployment', api: appsV1Api, deleter: appsV1Api.deleteNamespacedDeployment.bind(appsV1Api) },
        { kind: 'Service', api: coreV1Api, deleter: coreV1Api.deleteNamespacedService.bind(coreV1Api) },
        { kind: 'Ingress', api: networkingV1Api, deleter: networkingV1Api.deleteNamespacedIngress.bind(networkingV1Api) },
    ];

    for (const resource of resources) {
        try {
            const name = resource.kind === 'Job' ? `${k8sName}-hydrator` : k8sName;
            console.log(`[K8S] Attempting to delete existing ${resource.kind}: ${name}...`);
            await resource.deleter({
                name,
                namespace,
                body: deleteOptions,
            });
            console.log(`[K8S] Successfully deleted existing ${resource.kind}: ${name}`);
        } catch (error: any) {
            // It's okay if the resource doesn't exist (404), that's our goal.
            if (error.statusCode === 404) {
                console.log(`[K8S] No pre-existing ${resource.kind} found for ${k8sName}. Skipping deletion.`);
            } else {
                console.error(`[K8S] Error deleting existing ${resource.kind} for ${k8sName}:`, error.body || error);
                // Decide if this should be a fatal error or just a warning
            }
        }
    }
}

// --- MAIN EVENT HANDLER ---
export default defineEventHandler(async (event) => {
    const pb = createPocketBaseInstance(event);
    const config = useRuntimeConfig();
    const env = config.ENV || 'DEV';

    if (!pb.authStore.isValid) {
        console.warn(`[AUTH] Unauthorized request received.`);
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
    const ownerId = pb.authStore.record?.id;

    const { workspaceId } = await readBody(event);
    if (!workspaceId) {
        console.warn(`[WORKSPACE START] Missing workspaceId in request body.`);
        throw createError({ statusCode: 400, statusMessage: 'workspaceId is required.' });
    }

    console.log(`[WORKSPACE START] Request received for workspaceId=${workspaceId} by user=${ownerId}`);

    const workspace = await pb.collection('workspaces').getOne(workspaceId);
    if (workspace.owner !== ownerId) {
        console.warn(`[WORKSPACE START] Forbidden access: workspace ${workspaceId} does not belong to user ${ownerId}`);
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: You do not own this workspace.' });
    }

    // Skip K8s deployment in DEV mode
    if (env === 'DEV') {
        console.log(`[WORKSPACE START] DEV mode detected - skipping K8s deployment for ${workspace.name}`);

        // Update workspace status to running without deploying
        await pb.collection('workspaces').update(workspaceId, {
            k8s_name: workspace.name,
            status: 'running'
        });

        return {
            success: true,
            message: `Workspace ${workspace.name} is ready (DEV mode - using local bridge/worker).`,
            url: 'ws://localhost:2024',
        };
    }

    const namespace = 'default';
    console.log(`[K8S] Starting deployment for workspace=${workspace.name}, k8sName=${workspace.name}, namespace=${namespace}`);

    console.log(`[K8S] Cleaning up any existing resources for ${workspace.name}...`);
    await deleteExistingResources(workspace.name, namespace);

    const templatePath = path.join(process.cwd(), '..' ,'docker', 'service.yaml');
    console.log(`[K8S] Reading Kubernetes manifest template from: ${templatePath}`);
    const manifests = await readAndParseKubeYaml(templatePath, workspace.name);
    console.log(`[K8S] Parsed ${manifests.length} manifest(s) from template for ${workspace.name}`);

    const { appsV1Api, coreV1Api, networkingV1Api, batchV1Api } = createK8sClients();

    try {
        for (const manifest of manifests) {
            if (!manifest.kind || !manifest.metadata?.name) {
                console.warn(`[K8S] Skipping invalid manifest:`, manifest);
                continue;
            }

            console.log(`[K8S] Creating resource: kind=${manifest.kind}, name=${manifest.metadata.name}, ns=${namespace}`);
            switch (manifest.kind) {
                case "Job":
                    await batchV1Api.createNamespacedJob({ namespace, body: manifest });
                    break;
                case "Deployment":
                    await appsV1Api.createNamespacedDeployment({ namespace, body: manifest });
                    break;
                case "Service":
                    await coreV1Api.createNamespacedService({ namespace, body: manifest });
                    break;
                case "Ingress":
                    await networkingV1Api.createNamespacedIngress({ namespace, body: manifest });
                    break;
                default:
                    console.warn(`[K8S] Unsupported kind in template: ${manifest.kind}`);
            }
            console.log(`[K8S] Successfully created ${manifest.kind}: ${manifest.metadata.name}`);
        }

        console.log(`[K8S] ✅ All resources for ${workspace.name} have been created.`);

        const ingressUrl = `https://${workspace.name}.roomcursor.vom`;
        console.log(`[WORKSPACE START] Updating workspace ${workspaceId} status to 'running'. Ingress URL: ${ingressUrl}`);

        await pb.collection('workspaces').update(workspaceId, {
            k8s_name: workspace.name,
            status: 'running'
        });

        return {
            success: true,
            message: `Workspace ${workspace.name} is starting.`,
            url: ingressUrl,
        };

    } catch (error: any) {
        console.error(`[WORKSPACE START] ❌ Error deploying Kubernetes resources for ${workspace.name}:`, error.body || error);
        await pb.collection('workspaces').update(workspaceId, { status: 'failed', is_active: false });
        throw createError({ statusCode: 500, statusMessage: 'Failed to deploy workspace to Kubernetes.' });
    }
});
