export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);

  if (pb.authStore.isValid) {
    return {
      user: pb.authStore.record,
    };
  }

  return {
    user: null,
  };
});