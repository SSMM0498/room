export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);

  try {
    const tags = await pb.collection('tags').getFullList({
      sort: 'name',
    });

    const courses = await pb.collection('courses').getFullList({
      filter: 'status = "published"',
      sort: '-created',
      expand: 'author,tags',
    });

    return { tags, courses };
  } catch (error) {
    console.error('Home feed error:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load home page data.',
    });
  }
});