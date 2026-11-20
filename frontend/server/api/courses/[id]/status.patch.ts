import type { RecordModel } from 'pocketbase';
import type PocketBase from 'pocketbase';

/**
 * Change a course status (publish / unpublish / archive)
 * PATCH /api/courses/:id/status
 *
 * Author only. This is the single entry point for the publication state: it refuses to
 * make a course visible before it has something to play.
 */

const COURSE_STATUSES = ['draft', 'public', 'private', 'student', 'unlisted', 'archived'];

// Statuses that expose the course to someone other than its author.
const VISIBLE_STATUSES = ['public', 'private', 'student', 'unlisted'];

/**
 * Returns the reason why a course cannot be made visible, or null when it is ready.
 */
const findPublishBlocker = async (pb: PocketBase, course: RecordModel): Promise<string | null> => {
  if (course.type === 'single') {
    const recordings = await pb.collection('course_contents').getList(1, 1, {
      filter: pb.filter('course = {:courseId}', { courseId: course.id }),
      fields: 'id',
    });
    if (recordings.totalItems === 0) {
      return 'Record a lesson before publishing this course.';
    }
  }

  if (course.type === 'cursus') {
    const items = await pb.collection('course_items').getList(1, 1, {
      filter: pb.filter('cursus = {:courseId}', { courseId: course.id }),
      fields: 'id',
    });
    if (items.totalItems === 0) {
      return 'Add at least one course to this path before publishing it.';
    }
  }

  return null;
};

export default defineEventHandler(async (event) => {
  const pb = await createPocketBaseInstance(event);
  const user = requireAuthUser(event, pb);
  const courseId = getRouterParam(event, 'id');
  const { status } = await readBody<{ status?: string }>(event) ?? {};

  if (!courseId) {
    throw createError({ statusCode: 400, statusMessage: 'Course ID is required.' });
  }

  if (!status || !COURSE_STATUSES.includes(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Status must be one of: ${COURSE_STATUSES.join(', ')}.`,
    });
  }

  let course: RecordModel;
  try {
    course = await pb.collection('courses').getOne(courseId);
  } catch (error) {
    if (isNotFoundError(error)) {
      throw createError({ statusCode: 404, statusMessage: 'Course not found.' });
    }
    throw error;
  }

  if (course.author !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Only the author can change this course status.' });
  }

  if (VISIBLE_STATUSES.includes(status)) {
    const blocker = await findPublishBlocker(pb, course);
    if (blocker) {
      throw createError({ statusCode: 422, statusMessage: blocker });
    }
  }

  try {
    return await pb.collection('courses').update(courseId, { status }, { expand: 'author,tags,school' });
  } catch (error) {
    console.error(`Failed to update status of course ${courseId}:`, error);
    throw createError({ statusCode: 400, statusMessage: 'Failed to update the course status.' });
  }
});
