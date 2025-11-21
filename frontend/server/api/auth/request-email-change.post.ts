export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  if (event.context.authFailed) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const { newEmail } = await readBody(event);
  try {
    await pb.collection('users').requestEmailChange(newEmail);
    return { success: true, message: `A confirmation link has been sent to ${newEmail}.` };
  } catch (error) {
    console.error('Email change request error:', error);
    throw createError({ statusCode: 400, statusMessage: 'Failed to request email change.' });
  }
});