import { RecordModel } from "pocketbase";

export default defineEventHandler(async (event) => {
  const pb = createPocketBaseInstance(event);
  const username = event.context.params?.username as string;

  const authUserId = pb.authStore.isValid ? pb.authStore.record?.id : null;

  try {
    const targetUser = await pb.collection('users').getFirstListItem(`username = "${username}"`);

    let school: RecordModel | null = null;
    try {
      school = await pb.collection('schools').getFirstListItem(`owner = "${targetUser.id}"`);
    } catch (error: any) {
      if (error.response?.status !== 404) throw error;
    }

    let courseFilter = `author = "${targetUser.id}"`;
    if (authUserId !== targetUser.id) {
      courseFilter += ` && status = "public"`;
    }

    const courses = await pb.collection('courses').getFullList({
      filter: courseFilter,
      sort: '-created',
      expand: 'tags,author',
    });

    return {
      user: targetUser,
      school,
      courses,
    };

  } catch (error: any) {
    if (error.response?.status === 404) {
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