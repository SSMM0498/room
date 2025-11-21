export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);
    const userToUnfollowId = event.context.params?.id as string;

    if (event.context.authFailed) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required'
        })
    }
    const followerId = pb.authStore.record?.id;

    try {
        // Find the specific follow record to delete
        const followRecord = await pb.collection('followers').getFirstListItem(
            `user = "${followerId}" && following = "${userToUnfollowId}"`
        );

        await pb.collection('followers').delete(followRecord.id);
        return { success: true };
    } catch (error) {
        console.error('Unfollow error:', error);
        throw createError({ statusCode: 400, statusMessage: 'Failed to unfollow user.' });
    }
});