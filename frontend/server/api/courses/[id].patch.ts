// Fields an author may edit directly. `status` is deliberately excluded: publication goes
// through /api/courses/:id/status so the readiness checks cannot be bypassed.
const EDITABLE_FIELDS = ['title', 'description', 'tags', 'type', 'price', 'duration'];

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

  const updates = Object.fromEntries(
    Object.entries(data ?? {}).filter(([field]) => EDITABLE_FIELDS.includes(field))
  );

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No editable field provided.' });
  }

  try {
    const updatedCourse = await pb.collection('courses').update(courseId, updates, {
      expand: 'author,tags,school',
    });
    return updatedCourse;
  } catch (error) {
    console.error('Course update failed:', error);
    throw createError({ statusCode: 400, statusMessage: 'Failed to update course.' });
  }
});
