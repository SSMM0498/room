export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);
  if (!pb.authStore.isValid) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const { oldPassword, newPassword, newPasswordConfirm } = await readBody(event);
  const userId = pb.authStore.record?.id;

  try {
    const updatedUser = await pb.collection('users').update(userId!, {
      oldPassword,
      password: newPassword,
      passwordConfirm: newPasswordConfirm,
    });
    return { user: updatedUser };
  } catch (error) {
    console.error('Password change error:', error);
    throw createError({ statusCode: 400, statusMessage: 'Failed to change password. Check your old password.' });
  }
});