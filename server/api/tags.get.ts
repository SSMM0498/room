export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);

  try {
    // Fetch all records from the 'tags' collection, sorting by name
    const tags = await pb.collection('tags').getFullList({
      sort: 'name',
    });

    return tags;
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not load tags.',
    });
  }
});