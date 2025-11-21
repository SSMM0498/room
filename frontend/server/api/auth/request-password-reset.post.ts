import { ClientResponseError } from 'pocketbase';

export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);

  const { email } = await readBody(event);

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email is required.',
    });
  }

  try {
    await pb.collection('users').requestPasswordReset(email);

    return {
      success: true,
      message: 'If an account exists with this email, you will receive a password reset link.',
    };
  } catch (error) {
    console.error('Password Reset Error:', error);

    if (error instanceof ClientResponseError) {
      throw createError({
        statusCode: error.status,
        statusMessage: 'Failed to send reset link due to a server configuration issue.',
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred. Please try again later.',
    });
  }
});