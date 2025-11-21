export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const commentId = event.context.params?.id as string;
  pb.autoCancellation(false);

  try {
    // Get all replies for this comment
    const replies = await pb.collection('comments').getFullList({
      filter: `replyTo = "${commentId}"`,
      sort: 'created',
      expand: 'author',
    });

    // Get comment rates for the current user if authenticated
    let userRates: any[] = [];
    if (pb.authStore.isValid) {
      const userId = pb.authStore.record?.id;
      userRates = await pb.collection('comment_rates').getFullList({
        filter: `user = "${userId}"`,
      });
    }

    // Build a map of comment rates by comment id
    const ratesMap = new Map();
    userRates.forEach((rate: any) => {
      ratesMap.set(rate.comment, rate);
    });

    // Get total rates for each reply
    const repliesWithRates = await Promise.all(
      replies.map(async (reply: any) => {
        const rates = await pb.collection('comment_rates').getFullList({
          filter: `comment = "${reply.id}"`,
        });

        const likes = rates.filter((r: any) => r.like === true).length;
        const userRate = ratesMap.get(reply.id);

        return {
          ...reply,
          likes,
          userLiked: userRate?.like || false,
          replyCount: 0,
          replies: [],
        };
      })
    );

    return repliesWithRates;
  } catch (error) {
    console.error(`Failed to fetch replies for comment ${commentId}:`, error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch replies.' });
  }
});
