/**
 * Start a workspace
 * POST /api/workspace/start
 *
 * Owner only. With the local runtime a single bridge/worker started by hand
 * serves every workspace, so there is nothing to deploy. With the k8s runtime
 * the workspace gets a fresh pod, reachable on its own sub-domain (its name,
 * which is the course slug).
 */
export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);
    const config = useRuntimeConfig();

    if (event.context.authFailed) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required'
        })
    }
    const ownerId = pb.authStore.record?.id;

    const { workspaceId } = await readBody(event);
    if (!workspaceId) {
        console.warn(`[WORKSPACE START] Missing workspaceId in request body.`);
        throw createError({ statusCode: 400, statusMessage: 'workspaceId is required.' });
    }

    console.log(`[WORKSPACE START] Request received for workspaceId=${workspaceId} by user=${ownerId}`);

    const workspace = await pb.collection('workspaces').getOne(workspaceId, { expand: 'language' });
    if (workspace.owner !== ownerId) {
        console.warn(`[WORKSPACE START] Forbidden access: workspace ${workspaceId} does not belong to user ${ownerId}`);
        throw createError({ statusCode: 403, statusMessage: 'Forbidden: You do not own this workspace.' });
    }

    if (!workspacesRunOnK8s()) {
        console.log(`[WORKSPACE START] Local runtime - skipping K8s deployment for ${workspace.name}`);

        // Update workspace status to running without deploying
        await pb.collection('workspaces').update(workspaceId, {
            k8s_name: workspace.name,
            status: 'running'
        });

        return {
            success: true,
            message: `Workspace ${workspace.name} is ready (using local bridge/worker).`,
            url: 'ws://localhost:2024',
        };
    }

    const k8sName = workspaceK8sName(workspace.id);
    const subdomain = workspaceSubdomain(workspace);
    console.log(`[K8S] Starting deployment for workspace=${workspace.name}, k8sName=${k8sName}, subdomain=${subdomain}`);

    // The pod is hydrated from MinIO. A workspace that has no files there yet still
    // starts, with an empty folder, so a storage problem does not block the IDE.
    try {
        await seedWorkspaceFiles(workspace.id, workspace.expand?.language?.name);
    } catch (error: any) {
        console.warn(`[WORKSPACE START] Could not prepare the files of ${k8sName}:`, error.message || error.code || error);
    }

    try {
        await deleteWorkspaceResources(k8sName);
        await deployWorkspace(k8sName, subdomain);

        const url = `ws://${subdomain}.${config.public.WORKSPACE_DOMAIN}/ws`;
        console.log(`[WORKSPACE START] ✅ ${k8sName} is running at ${url}`);

        await pb.collection('workspaces').update(workspaceId, {
            k8s_name: k8sName,
            status: 'running'
        });

        return {
            success: true,
            message: `Workspace ${workspace.name} is running.`,
            url,
        };

    } catch (error: any) {
        console.error(`[WORKSPACE START] ❌ Error deploying Kubernetes resources for ${k8sName}:`, error.body || error);
        await pb.collection('workspaces').update(workspaceId, { status: 'sleeping' }).catch(() => {});
        throw createError({ statusCode: 500, statusMessage: 'Failed to deploy workspace to Kubernetes.' });
    }
});
