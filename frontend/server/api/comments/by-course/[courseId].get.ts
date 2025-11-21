export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const courseId = event.context.params?.courseId as string;

  try {
    // Get only top-level comments (no replies) by default
    const comments = await pb.collection('comments').getFullList({
      filter: `course = "${courseId}" && replyTo = ""`,
      sort: '-created',
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

    // Get total rates and reply count for each comment
    const commentsWithMeta = await Promise.all(
      comments.map(async (comment: any) => {
        const rates = await pb.collection('comment_rates').getFullList({
          filter: `comment = "${comment.id}"`,
        });

        // Count replies for this comment
        const replyCount = await pb.collection('comments').getList(1, 1, {
          filter: `replyTo = "${comment.id}"`,
        });

        const likes = rates.filter((r: any) => r.like === true).length;
        const userRate = ratesMap.get(comment.id);

        return {
          ...comment,
          likes,
          userLiked: userRate?.like || false,
          replyCount: replyCount.totalItems,
          replies: [], // Empty by default, will be loaded on demand
        };
      })
    );

    return commentsWithMeta;
  } catch (error) {
    console.error(`Failed to fetch comments for course ${courseId}:`, error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch comments.' });
  }
});
