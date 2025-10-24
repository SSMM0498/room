export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);

  if (!pb.authStore.isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized. Please log in.',
    });
  }

  const userId = pb.authStore.record?.id;

  try {
    // Fetch progress records for the current user where completed is false
    const progressRecords = await pb.collection('progress').getFullList({
      filter: `user = "${userId}" && completed = false`,
      sort: '-updated',
      expand: 'course,course.tags',
    });

    // Map the progress records to include course data and progress percentage
    const inProgressCourses = progressRecords.map((record) => {
      const course = record.expand?.course;
      if (!course) return null;

      const progress = course.duration > 0
        ? Math.round((record.current_time / course.duration) * 100)
        : 0;

      return {
        id: course.id,
        title: course.title,
        slug: course.slug,
        description: course.description,
        progress,
        currentTime: record.current_time,
        duration: course.duration,
        tags: record.expand?.['course.tags'] || course.expand?.tags || [],
        updatedAt: record.updated,
      };
    }).filter(Boolean); // Remove null entries

    return inProgressCourses;
  } catch (error: any) {
    console.error('Error fetching in-progress courses:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch in-progress courses.',
    });
  }
});
