/**
 * Fetch a workspace by ID
 * GET /api/workspace/:id
 *
 * Owner only.
 */
export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const user = requireAuthUser(event, pb);
  const workspaceId = getRouterParam(event, 'id');

  if (!workspaceId) {
    throw createError({ statusCode: 400, statusMessage: 'Workspace ID is required.' });
  }

  try {
    const workspace = await pb.collection('workspaces').getOne(workspaceId, { expand: 'language' });

    if (workspace.owner !== user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden: You do not own this workspace.' });
    }

    return workspace;
  } catch (error) {
    if (isNotFoundError(error)) {
      throw createError({ statusCode: 404, statusMessage: 'Workspace not found.' });
    }
    throw error;
  }
});
