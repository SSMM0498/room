export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);
  const itemId = event.context.params?.itemId as string;

  if (!pb.authStore.isValid) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const itemToDelete = await pb.collection('course_items').getOne(itemId, { expand: 'parent' });
  if (itemToDelete.expand?.parent.author !== pb.authStore.record?.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  try {
    await pb.collection('course_items').delete(itemId);
    return { success: true };
  } catch (error) {
    console.error('Failed to remove item from cursus:', error);
    throw createError({ statusCode: 400, statusMessage: 'Could not remove course from cursus.' });
  }
});