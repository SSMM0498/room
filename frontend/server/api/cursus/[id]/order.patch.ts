export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);
    const cursusId = event.context.params?.id as string;
    const orderedItemIds = await readBody(event) as string[];

    if (event.context.authFailed) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required'
        })
    }

    const parentCursus = await pb.collection('courses').getOne(cursusId);
    if (parentCursus.author !== pb.authStore.record?.id) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }

    try {
        const updatePromises = orderedItemIds.map((itemId, index) => {
            return pb.collection('course_items').update(itemId, { order: index });
        });

        await Promise.all(updatePromises);

        return { success: true };
    } catch (error) {
        console.error('Failed to update cursus order:', error);
        throw createError({ statusCode: 400, statusMessage: 'Could not update order. Please try again.' });
    }
});