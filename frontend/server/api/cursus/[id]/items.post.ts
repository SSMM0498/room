export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const cursusId = event.context.params?.id as string;
  const { courseIdToAdd } = await readBody(event);

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
    const items = await pb.collection('course_items').getFullList({ filter: `cursus = "${cursusId}"` });

    const newItem = await pb.collection('course_items').create({
      cursus: cursusId,
      course: courseIdToAdd,
      order: items.length,
    });
    return newItem;
  } catch (error) {
    console.error('Failed to add item to cursus:', error);
    throw createError({ statusCode: 400, statusMessage: 'Could not add course to cursus.' });
  }
});