export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const itemId = event.context.params?.itemId as string;

  if (event.context.authFailed) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const itemToDelete = await pb.collection('course_items').getOne(itemId, { expand: 'cursus' });
  if (itemToDelete.expand?.cursus.author !== pb.authStore.record?.id) {
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