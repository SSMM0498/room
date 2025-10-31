/**
 * Fetch course content by course ID
 * GET /api/course-contents/by-course/:courseId
 *
 * Returns the most recent course_contents record for the given course
 */
export default defineEventHandler(async (event) => {
    const pb = createPocketBaseInstance(event);
    const courseId = getRouterParam(event, 'courseId');

    if (!courseId) {
        throw createError({ statusCode: 400, statusMessage: 'Course ID is required' });
    }

    try {
        // Fetch the most recent content for this course
        const records = await pb.collection('course_contents').getFullList({
            filter: `course="${courseId}"`,
            sort: '-created',
            $autoCancel: false,
        });

        if (records.length === 0) {
            return {
                success: true,
                data: null,
            };
        }

        const record = records[0];

        // Generate file URLs
        const baseURL = pb.baseURL;
        const collectionId = record.collectionId;
        const recordId = record.id;

        const responseData = {
            ...record,
            room_json_url: record.room_json
                ? `${baseURL}api/files/${collectionId}/${recordId}/${record.room_json}`
                : null,
            audio_url: record.audio
                ? `${baseURL}api/files/${collectionId}/${recordId}/${record.audio}`
                : null,
            thumbnail_url: record.thumbnail
                ? `${baseURL}api/files/${collectionId}/${recordId}/${record.thumbnail}`
                : null,
        };

        return {
            success: true,
            data: responseData,
        };
    } catch (error: any) {
        console.error('[API] Failed to fetch course content:', error);

        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to fetch course content'
        });
    }
});
