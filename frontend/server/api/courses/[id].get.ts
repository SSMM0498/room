export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);
  const courseId = event.context.params?.id as string;

  try {
    const course = await pb.collection('courses').getOne(courseId, {
      expand: 'author,tags,school',
    });

    if (course.type === 'cursus') {
      const courseItems = await pb.collection('course_items').getFullList({
        filter: `cursus = "${course.id}"`,
        sort: 'order',
        expand: 'course,course.author,course.tags',
      });
      // Attach the items to the main course object
      course.items = courseItems;
    }

    return course;
  } catch (error) {
    console.error(`Failed to fetch course ${courseId}:`, error);
    throw createError({ statusCode: 404, statusMessage: 'Course not found.' });
  }
});
