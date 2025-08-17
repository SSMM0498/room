export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);
  const slug = event.context.params?.slug as string;

  try {
    // Fetch the first record that matches the slug
    const course = await pb.collection('courses').getFirstListItem(`slug = "${slug}"`, {
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
    console.error(`Failed to fetch course with slug ${slug}:`, error);
    throw createError({ statusCode: 404, statusMessage: 'Course not found.' });
  }
});