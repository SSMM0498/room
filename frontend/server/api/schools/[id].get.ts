/**
 * Public school profile
 * GET /api/schools/:id
 *
 * Returns the school (with owner and topics expanded) and its public courses.
 */
export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const school = await loadSchool(pb, getRouterParam(event, 'id'), 'owner,topics');

  try {
    const courses = await pb.collection('courses').getFullList({
      filter: pb.filter('school = {:schoolId} && status = "public"', { schoolId: school.id }),
      sort: '-created',
      expand: 'author,tags,school',
    });

    return { school, courses: await withCursusItems(pb, await withCourseStats(pb, courses)) };
  } catch (error) {
    console.error(`Failed to fetch courses for school ${school.id}:`, error);
    throw createError({ statusCode: 500, statusMessage: 'Could not load the school courses.' });
  }
});
