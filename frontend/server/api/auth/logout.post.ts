export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);

  pb.authStore.clear();

  return {
    message: 'Logout successful',
  };
});