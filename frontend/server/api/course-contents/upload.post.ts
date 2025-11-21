/**
 * Upload course content (recording)
 * POST /api/course-contents/upload
 *
 * Expects multipart/form-data with:
 * - courseId: string
 * - room_json: File (NDJSON)
 * - audio: File (optional)
 * - thumbnail: File (optional)
 */
export default defineEventHandler(async (event) => {
    const pb = await createPocketBaseInstance(event);

    if (event.context.authFailed) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Authentication required'
        })
    }

    try {
        // Read multipart form data
        const formData = await readMultipartFormData(event);

        if (!formData) {
            throw createError({ statusCode: 400, statusMessage: 'No form data provided' });
        }

        // Extract fields from form data
        let courseId: string | undefined;
        let roomJsonFile: File | undefined;
        let audioFile: File | undefined;
        let thumbnailFile: File | undefined;

        for (const field of formData) {
            if (field.name === 'courseId' && field.data) {
                courseId = field.data.toString('utf-8');
            } else if (field.name === 'room_json' && field.data && field.filename) {
                // Convert Buffer to Uint8Array for File constructor
                roomJsonFile = new File([new Uint8Array(field.data)], field.filename, {
                    type: field.type || 'application/x-ndjson'
                });
            } else if (field.name === 'audio' && field.data && field.filename) {
                audioFile = new File([new Uint8Array(field.data)], field.filename, {
                    type: field.type || 'audio/webm'
                });
            } else if (field.name === 'thumbnail' && field.data && field.filename) {
                thumbnailFile = new File([new Uint8Array(field.data)], field.filename, {
                    type: field.type || 'image/jpeg'
                });
            }
        }

        if (!courseId) {
            throw createError({ statusCode: 400, statusMessage: 'courseId is required' });
        }

        if (!roomJsonFile) {
            throw createError({ statusCode: 400, statusMessage: 'room_json file is required' });
        }

        // Verify the user owns the course
        const course = await pb.collection('courses').getOne(courseId);
        if (course.author !== pb.authStore.record!.id) {
            throw createError({ statusCode: 403, statusMessage: 'You do not own this course' });
        }

        // Create FormData for PocketBase
        const pbFormData = new FormData();
        pbFormData.append('course', courseId);
        pbFormData.append('room_json', roomJsonFile);

        if (audioFile) {
            pbFormData.append('audio', audioFile);
        }

        if (thumbnailFile) {
            pbFormData.append('thumbnail', thumbnailFile);
        }

        // Create the course_contents record
        const record = await pb.collection('course_contents').create(pbFormData);

        setResponseStatus(event, 201);
        return {
            success: true,
            data: record,
        };
    } catch (error: any) {
        console.error('[API] Course content upload failed:', error);

        if (error.statusCode) {
            throw error;
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || 'Failed to upload course content'
        });
    }
});
