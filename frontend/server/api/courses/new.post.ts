export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);

    // A request without a session must be answered 401, not crash further down
    // and surface as "Failed to create the course".
    const user = requireAuthUser(event, pb);

    try {
        const body = await readBody(event);

        const dataToCreate = {
            ...body,
            author: user.id,
        };

        const newCourseRecord = await pb.collection('courses').create(dataToCreate, {
            expand: 'author,tags,school',
        });

        setResponseStatus(event, 201);
        return newCourseRecord;
    } catch (error) {
        console.error('Course creation failed:', error);
        throw createError({ statusCode: 500, statusMessage: 'Failed to create the course.' });
    }
});