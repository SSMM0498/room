export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  if (event.context.authFailed) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  if (pb.authStore.isValid && pb.authStore.record) {
    return {
      user: pb.authStore.record,
    };
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Failed to fetch user data',
  });
});