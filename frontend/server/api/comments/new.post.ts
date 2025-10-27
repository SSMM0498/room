export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);

  if (!pb.authStore.isValid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  try {
    const body = await readBody(event);

    // Validate required fields
    if (!body.course || !body.content) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: course and content are required.'
      });
    }

    const dataToCreate = {
      author: pb.authStore.record!.id,
      course: body.course,
      content: body.content,
      replyTo: body.replyTo || null,
    };

    const newComment = await pb.collection('comments').create(dataToCreate, {
      expand: 'author,replyTo,replyTo.author',
    });

    // Get rates for the new comment (will be 0)
    const enhancedComment = {
      ...newComment,
      likes: 0,
      userLiked: false,
      replies: [],
    };

    setResponseStatus(event, 201);
    return enhancedComment;
  } catch (error: any) {
    console.error('Comment creation failed:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create comment.'
    });
  }
});
