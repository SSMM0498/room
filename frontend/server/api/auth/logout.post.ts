export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const config = useRuntimeConfig();

  if (event.context.authFailed) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  pb.authStore.clear();
  deleteCookie(event, config.COOKIE_NAME);

  return {
    message: 'Logout successful',
  };
});