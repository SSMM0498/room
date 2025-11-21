export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const courseId = event.context.params?.id as string;
  const data = await readBody(event);

  if (event.context.authFailed) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const existingCourse = await pb.collection('courses').getOne(courseId);
  if (existingCourse.author !== pb.authStore.record?.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
  }

  try {
    const updatedCourse = await pb.collection('courses').update(courseId, data);
    return updatedCourse;
  } catch (error) {
    console.error('Course update failed:', error);
    throw createError({ statusCode: 400, statusMessage: 'Failed to update course.' });
  }
});