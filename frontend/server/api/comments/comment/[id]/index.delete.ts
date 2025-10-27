export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);
  const commentId = event.context.params?.id as string;

  if (!pb.authStore.isValid) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }

  try {
    // Check if the user is the author of the comment
    const existingComment = await pb.collection('comments').getOne(commentId);

    if (existingComment.author !== pb.authStore.record?.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: You can only delete your own comments.'
      });
    }

    // Delete the comment
    await pb.collection('comments').delete(commentId);

    return { success: true, message: 'Comment deleted successfully' };
  } catch (error: any) {
    console.error('Comment deletion failed:', error);

    if (error.statusCode) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete comment.'
    });
  }
});
