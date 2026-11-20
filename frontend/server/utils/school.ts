import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';

/**
 * Fetches a school by ID, translating PocketBase's 404 into an H3 error.
 */
export const loadSchool = async (pb: PocketBase, schoolId: string | undefined, expand?: string): Promise<RecordModel> => {
  if (!schoolId) {
    throw createError({ statusCode: 400, statusMessage: 'School ID is required.' });
  }

  try {
    return await pb.collection('schools').getOne(schoolId, expand ? { expand } : undefined);
  } catch (error) {
    if (isNotFoundError(error)) {
      throw createError({ statusCode: 404, statusMessage: 'School not found.' });
    }
    throw error;
  }
};

/**
 * Throws a 403 unless the given user owns the school.
 */
export const assertSchoolOwner = (school: RecordModel, user: RecordModel) => {
  if (school.owner !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Only the school owner can do this.' });
  }
};
