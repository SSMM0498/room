export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);
    if (event.context.authFailed) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required'
        })
    }
    const profileUserId = event.context.params?.id as string;

    const authUserId = pb.authStore.isValid ? pb.authStore.record?.id : null;

    try {
        const followersResult = await pb.collection('followers').getList(1, 1, {
            filter: `following = "${profileUserId}"`,
        });
        const followerCount = followersResult.totalItems;

        const followingResult = await pb.collection('followers').getList(1, 1, {
            filter: `user = "${profileUserId}"`,
        });
        const followingCount = followingResult.totalItems;

        let isFollowing = false;
        let followRecordId: string | null = null;

        if (authUserId && authUserId !== profileUserId) {
            try {
                const followRecord = await pb.collection('followers').getFirstListItem(
                    `user = "${authUserId}" && following = "${profileUserId}"`
                );
                isFollowing = true;
                followRecordId = followRecord.id;
            } catch (error: any) {
                if (error.response?.status !== 404) {
                }
            }
        }

        return {
            followerCount,
            followingCount,
            isFollowing,
            followRecordId,
        };

    } catch (error: any) {
        console.error(`Error fetching follow status for user ${profileUserId}:`, error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch follow status.',
            data: error
        });
    }
});