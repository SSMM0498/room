export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);

  pb.authStore.clear();
  deleteCookie(event, 'pb_auth');

  return {
    message: 'Logout successful',
  };
});