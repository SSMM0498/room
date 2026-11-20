import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';

/**
 * Attaches its ordered children to every cursus of a listing, the way the
 * single-course endpoints already do, so a cursus card can show what it contains
 * without fetching anything of its own.
 *
 * A cursus is a grouping of courses and carries no recording, so the children are
 * the whole of its content. They are read in one list query for the whole batch,
 * and only when the listing actually holds a cursus.
 *
 * Best-effort: a failure leaves the courses untouched rather than breaking the
 * listing over a tab most cards never open.
 */
export const withCursusItems = async <T extends RecordModel>(
  pb: PocketBase,
  courses: T[],
): Promise<T[]> => {
  const cursus = courses.filter(course => course.type === 'cursus');
  if (cursus.length === 0) return courses;

  try {
    const items = await pb.collection('course_items').getFullList({
      filter: pb.filter(
        cursus.map((_, index) => `cursus = {:c${index}}`).join(' || '),
        Object.fromEntries(cursus.map((course, index) => [`c${index}`, course.id])),
      ),
      sort: 'order',
      // Lighter than the single-course endpoints: a card only names its children.
      expand: 'course,course.tags',
    });

    const byCursus = new Map<string, RecordModel[]>();
    for (const item of items) {
      const cursusId = item.cursus as string;
      if (!byCursus.has(cursusId)) byCursus.set(cursusId, []);
      byCursus.get(cursusId)!.push(item);
    }

    for (const course of cursus) {
      course.items = byCursus.get(course.id) ?? [];
    }
  } catch (error) {
    console.error('Failed to load the cursus children:', error);
  }

  return courses;
};
