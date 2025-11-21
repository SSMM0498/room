import { ClientResponseError } from 'pocketbase';

export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);

  const { email, username, password, passwordConfirm } = await readBody(event);

  if (!email || !username || !password || !passwordConfirm) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields.' });
  }

  try {
    await pb.collection('users').create({
      email,
      username,
      password,
      passwordConfirm,
      name: username, // Assuming name is the same as username initially
      emailVisibility: true,
    });

    await pb.collection('users').requestVerification(email);

    await pb.collection('users').authWithPassword(email, password);

    return {
      user: pb.authStore.record,
    };
  } catch (error) {
    if (error instanceof ClientResponseError) {
      throw createError({
        statusCode: error.status,
        statusMessage: error.response.message || 'Registration failed.',
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An unexpected error occurred during registration.',
    });
  }
});