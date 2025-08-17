export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);
  const courseId = event.context.params?.id as string;

  if (!pb.authStore.isValid) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const courseToDelete = await pb.collection('courses').getOne(courseId);
  if (courseToDelete.author !== pb.authStore.record?.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  try {
    if (courseToDelete.type === 'cursus') {
      const items = await pb.collection('course_items').getFullList({
        filter: `parent = "${courseId}"`,
      });
      const deletePromises = items.map(item => pb.collection('course_items').delete(item.id));
      await Promise.all(deletePromises);
    }

    await pb.collection('courses').delete(courseId);
    return { success: true };
  } catch (error) {
    console.error('Course deletion failed:', error);
    throw createError({ statusCode: 400, statusMessage: 'Failed to delete course.' });
  }
});