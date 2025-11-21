export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const courseId = event.context.params?.courseId as string;


  try {
    // Find the first workspace that has a relation to this course.
    // In a real app, you might add more filters like `owner = @request.auth.id`.
    const workspace = await pb.collection('workspaces').getFirstListItem(`course = "${courseId}"`);
    return workspace;
  } catch (error: any) {
    // A 404 here means no workspace is linked to this course yet.
    if (error.response?.status === 404) {
      throw createError({ statusCode: 404, statusMessage: `No workspace found for course ${courseId}.` });
    }
    console.error(`Error fetching workspace for course ${courseId}:`, error);
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch workspace.' });
  }
});