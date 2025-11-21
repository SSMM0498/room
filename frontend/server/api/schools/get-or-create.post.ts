import { ClientResponseError } from 'pocketbase';

export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);
    if (event.context.authFailed) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required'
        })
    }
    const user = pb.authStore.record;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
        const existingSchool = await pb.collection('schools').getFirstListItem(`owner = "${user.id}"`, {
            expand: 'owner,courses(school)',
        });

        return existingSchool;

    } catch (error: any) {
        if (error instanceof ClientResponseError && error.status === 404) {
            try {
                const newSchoolData = {
                    name: `${user.username}'s School`,
                    owner: user.id,
                    members: [user.id],
                };

                const newSchool = await pb.collection('schools').create(newSchoolData, {
                    expand: 'owner,courses(school)',
                });

                return newSchool;
            } catch (error) {
                console.error('Failed to create a new school:', error);
                throw createError({ statusCode: 500, statusMessage: 'Could not create a school.' });
            }
        }

        console.error('Error in get-or-create school logic:', error);
        throw createError({ statusCode: 500, statusMessage: 'An unexpected error occurred.' });
    }
});