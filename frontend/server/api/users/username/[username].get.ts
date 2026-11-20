import { RecordModel } from "pocketbase";

export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const username = event.context.params?.username as string;

  const authUserId = pb.authStore.isValid ? pb.authStore.record?.id : null;

  try {
    const targetUser = await pb.collection('users').getFirstListItem(`username = "${username}"`);

    let school: RecordModel | null = null;
    try {
      school = await pb.collection('schools').getFirstListItem(`owner = "${targetUser.id}"`);
    } catch (error) {
      if (!isNotFoundError(error)) throw error;
    }

    let courseFilter = `author = "${targetUser.id}"`;
    if (authUserId !== targetUser.id) {
      courseFilter += ` && status = "public"`;
    }

    const courses = await pb.collection('courses').getFullList({
      filter: courseFilter,
      sort: '-created',
      expand: 'tags,author,school',
    });

    return {
      user: targetUser,
      school,
      courses: await withCursusItems(pb, await withCourseStats(pb, courses)),
    };

  } catch (error) {
    if (isNotFoundError(error)) {
      throw createError({
        statusCode: 404,
        statusMessage: `User profile for "${username}" not found.`,
      });
    }
    console.error(`Error fetching profile for ${username}:`, error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user profile.',
    });
  }
});