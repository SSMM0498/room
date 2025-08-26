export default defineEventHandler(async (event) => {
    const pb = createPocketBaseInstance(event);
    const userToFollowId = event.context.params?.id as string;

    if (!pb.authStore.isValid) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
    const followerId = pb.authStore.record?.id;

    if (userToFollowId === followerId) {
        throw createError({ statusCode: 400, statusMessage: 'You cannot follow yourself.' });
    }

    try {
        const data = {
            user: followerId,
            following: userToFollowId,
        };
        const followRecord = await pb.collection('followers').create(data);
        return { success: true, followRecordId: followRecord.id };
    } catch (error) {
        console.error('Follow error:', error);
        // You might get a 400 if the follow relationship already exists.
        throw createError({ statusCode: 400, statusMessage: 'Failed to follow user.' });
    }
});