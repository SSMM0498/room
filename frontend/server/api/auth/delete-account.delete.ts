export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);
  if (!pb.authStore.isValid) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const userId = pb.authStore.record?.id;

  try {
    await pb.collection('users').delete(userId!);
    // Clear the cookie upon successful deletion
    pb.authStore.clear();
    deleteCookie(event, 'pb_auth');
    return { success: true, message: 'Account deleted successfully.' };
  } catch (error) {
    console.error('Account deletion error:', error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete account.' });
  }
});