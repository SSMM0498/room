export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  if (event.context.authFailed) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const userId = pb.authStore.record?.id;
  const formData = new FormData();
  const body = await readMultipartFormData(event);

  if (body) {
    body.forEach(item => {
      if (item.name === 'name') {
        formData.append('name', item.data.toString());
      }
      if (item.name === 'avatar' && item.filename) {
        formData.append('avatar', new Blob([new Uint8Array(item.data)]), item.filename);
      }
    });
  }

  try {
    const updatedUser = await pb.collection('users').update(userId!, formData);
    return { user: updatedUser };
  } catch (error) {
    console.error('Profile update error:', error);
    throw createError({ statusCode: 400, statusMessage: 'Failed to update profile.' });
  }
});