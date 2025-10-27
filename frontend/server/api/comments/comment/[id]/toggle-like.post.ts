export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);
  const commentId = event.context.params?.id as string;

  if (!pb.authStore.isValid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  try {
    const userId = pb.authStore.record!.id;

    // Check if user already liked this comment
    const existingRates = await pb.collection('comment_rates').getFullList({
      filter: `comment = "${commentId}" && user = "${userId}"`,
    });

    if (existingRates.length > 0) {
      // Unlike: delete the rate
      await pb.collection('comment_rates').delete(existingRates[0].id);
      return { liked: false };
    } else {
      // Like: create a rate
      await pb.collection('comment_rates').create({
        comment: commentId,
        user: userId,
        like: true,
      });
      return { liked: true };
    }
  } catch (error: any) {
    console.error('Toggle like failed:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to toggle like.'
    });
  }
});
