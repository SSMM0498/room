export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);
    const tagName = getRouterParam(event, 'tagName');

    if (!tagName) {
        throw createError({ statusCode: 400, statusMessage: 'Tag name is required.' });
    }

    try {
        // First, fetch the tag by name to get its ID and data
        const tags = await pb.collection('tags').getFullList({
            filter: `name:lower = "${tagName}"`,
        });

        if (tags.length === 0) {
            throw createError({ statusCode: 404, statusMessage: `Tag "${tagName}" not found.` });
        }

        const tag = tags[0];
        const tagId = tag.id;

        // Fetch courses that have this tag
        const courses = await pb.collection('courses').getFullList({
            filter: `status = "public" && tags ~ "${tagId}"`,
            sort: '-created',
            expand: 'author,tags',
        });

        return {
            tag,
            courses
        };
    } catch (error: any) {
        if (error.statusCode) {
            throw error;
        }
        console.error('Failed to fetch courses by tag:', error);
        throw createError({ statusCode: 500, statusMessage: 'Could not load courses for this tag.' });
    }
});
