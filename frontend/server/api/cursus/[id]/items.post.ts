export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);
  const cursusId = event.context.params?.id as string;
  const { courseIdToAdd } = await readBody(event); 

  if (!pb.authStore.isValid) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });

  const parentCursus = await pb.collection('courses').getOne(cursusId);
  if (parentCursus.author !== pb.authStore.record?.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  try {
    const items = await pb.collection('course_items').getFullList({ filter: `parent = "${cursusId}"` });

    const newItem = await pb.collection('course_items').create({
      parent: cursusId,
      courses: [courseIdToAdd],
      order: items.length,
    });
    return newItem;
  } catch (error) {
    console.error('Failed to add item to cursus:', error);
    throw createError({ statusCode: 400, statusMessage: 'Could not add course to cursus.' });
  }
});