import { ClientResponseError } from 'pocketbase';

export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);

  const { email, password } = await readBody(event);

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email and password are required.',
    });
  }

  try {
    await pb.collection('users').authWithPassword(email, password);

    return {
      user: pb.authStore.record,
    };
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 400) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid email or password.',
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred.',
    });
  }
});