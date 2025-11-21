export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const commentId = event.context.params?.id as string;

  if (event.context.authFailed) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  try {
    const body = await readBody(event);

    // Check if the user is the author of the comment
    const existingComment = await pb.collection('comments').getOne(commentId);

    if (existingComment.author !== pb.authStore.record?.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: You can only edit your own comments.'
      });
    }

    // Only allow updating the content
    const updatedComment = await pb.collection('comments').update(commentId, {
      content: body.content,
    }, {
      expand: 'author,replyTo,replyTo.author',
    });

    return updatedComment;
  } catch (error: any) {
    console.error('Comment update failed:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update comment.'
    });
  }
});
