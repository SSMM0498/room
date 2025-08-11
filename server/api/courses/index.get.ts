export default defineEventHandler(async (event) => {
    const pb = createPocketBaseInstance(event);
    try {
        const courses = await pb.collection('courses').getFullList({
            filter: 'status = "published"',
            sort: '-created',
            expand: 'author,tags', // Expand author and tags for the listing cards
        });
        return courses;
    } catch (error) {
        console.error('Failed to fetch courses:', error);
        throw createError({ statusCode: 500, statusMessage: 'Could not load courses.' });
    }
});