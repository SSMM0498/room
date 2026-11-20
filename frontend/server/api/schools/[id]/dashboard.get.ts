/**
 * Instructor dashboard data
 * GET /api/schools/:id/dashboard
 *
 * Owner only. Returns the school and every course the instructor authored in it,
 * whatever its status, annotated with recording and cursus information.
 */
export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const user = requireAuthUser(event, pb);
  const school = await loadSchool(pb, getRouterParam(event, 'id'), 'topics');
  assertSchoolOwner(school, user);

  const params = { schoolId: school.id, userId: user.id };

  try {
    const [courses, contents, items] = await Promise.all([
      pb.collection('courses').getFullList({
        filter: pb.filter('school = {:schoolId} && author = {:userId}', params),
        sort: '-updated',
        expand: 'author,tags',
        requestKey: null,
      }),
      pb.collection('course_contents').getFullList({
        filter: pb.filter('course.school = {:schoolId}', params),
        fields: 'id,course,created',
        sort: '-created',
        requestKey: null,
      }),
      pb.collection('course_items').getFullList({
        filter: pb.filter('cursus.school = {:schoolId}', params),
        fields: 'id,cursus',
        requestKey: null,
      }),
    ]);

    // Contents are sorted newest first, so the first one seen per course is the latest recording.
    const latestRecordingByCourse = new Map<string, string>();
    for (const content of contents) {
      if (!latestRecordingByCourse.has(content.course)) {
        latestRecordingByCourse.set(content.course, content.created);
      }
    }

    const itemsCountByCursus = new Map<string, number>();
    for (const item of items) {
      itemsCountByCursus.set(item.cursus, (itemsCountByCursus.get(item.cursus) ?? 0) + 1);
    }

    return {
      school,
      courses: courses.map(course => ({
        ...course,
        latestRecordingAt: latestRecordingByCourse.get(course.id) ?? null,
        itemsCount: itemsCountByCursus.get(course.id) ?? 0,
      })),
    };
  } catch (error) {
    console.error(`Failed to load dashboard for school ${school.id}:`, error);
    throw createError({ statusCode: 500, statusMessage: 'Could not load the dashboard.' });
  }
});
