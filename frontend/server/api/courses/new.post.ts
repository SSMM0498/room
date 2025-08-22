export default defineEventHandler(async (event) => {
    const pb = createPocketBaseInstance(event);

    if (!pb.authStore.isValid) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
        const body = await readBody(event);

        const dataToCreate = {
        ...body,
        author: pb.authStore.record!.id,
        };

        const newCourseRecord = await pb.collection('courses').create(dataToCreate, {
        expand: 'author,tags',
        });

        setResponseStatus(event, 201);
        return newCourseRecord;
    } catch (error) {
        console.error('Course creation failed:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to create the course.' });
    }
});