export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);
    try {
        const courses = await pb.collection('courses').getFullList({
            filter: 'status = "public"',
            sort: '-created',
            expand: 'author,tags,school', // Expand author, tags and school for the listing cards
        });
        return await withCursusItems(pb, await withCourseStats(pb, courses));
    } catch (error) {
        console.error('Failed to fetch courses:', error);
        throw createError({ statusCode: 500, statusMessage: 'Could not load courses.' });
    }
});