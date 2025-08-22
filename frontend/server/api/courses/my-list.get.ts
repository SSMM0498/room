export default defineEventHandler(async (event) => {
    const pb = createPocketBaseInstance(event);
    const user = pb.authStore.record;

    if (!user) {
        throw createError({ statusCode: 401, message: 'Authentication required' });
    }

    const { type } = getQuery(event);

    let filterString = `author = "${user.id}"`;

    if (type && ['single', 'cursus', 'live'].includes(type as string)) {
        filterString += ` && type = "${type}"`;
    }

    try {
        const records = await pb.collection('courses').getFullList({
            filter: filterString,
            fields: 'id,title,slug,tags',
            expand: 'tags',
        });

        return records;
    } catch (error: any) {
        console.error('Failed to fetch user course list:', error);
        throw createError({ statusCode: 500, message: 'Failed to fetch user courses' });
    }
});