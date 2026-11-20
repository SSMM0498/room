export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const courseId = event.context.params?.id as string;

  if (event.context.authFailed) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const courseToDelete = await pb.collection('courses').getOne(courseId);
  if (courseToDelete.author !== pb.authStore.record?.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  try {
    if (courseToDelete.type === 'cursus') {
      const items = await pb.collection('course_items').getFullList({
        filter: `cursus = "${courseId}"`,
      });
      const deletePromises = items.map(item => pb.collection('course_items').delete(item.id));
      await Promise.all(deletePromises);
    }

    // `workspaces.course` is a required, non-cascading relation: PocketBase refuses to delete
    // a course that is still referenced by one.
    const workspaces = await pb.collection('workspaces').getFullList({
      filter: pb.filter('course = {:courseId}', { courseId }),
      fields: 'id',
    });
    await Promise.all(workspaces.map(workspace => pb.collection('workspaces').delete(workspace.id)));

    await pb.collection('courses').delete(courseId);
    return { success: true };
  } catch (error) {
    console.error('Course deletion failed:', error);
    throw createError({ statusCode: 400, statusMessage: 'Failed to delete course.' });
  }
});