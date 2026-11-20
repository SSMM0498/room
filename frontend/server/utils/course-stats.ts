import type PocketBase from 'pocketbase';
import type { RecordModel } from 'pocketbase';

/** Engagement counters the catalog filters sort on. */
export interface CourseStats {
  /** Learners who started the course — one `progress` record each. */
  participants: number;
  /** Likes the course collected in `course_rates`. */
  rating: number;
}

/** Builds a `course = "a" || course = "b"` filter covering a batch of course ids. */
const courseScopeFilter = (pb: PocketBase, ids: string[]) =>
  pb.filter(
    ids.map((_, index) => `course = {:c${index}}`).join(' || '),
    Object.fromEntries(ids.map((id, index) => [`c${index}`, id])),
  );

/** Counts how many records of a batch point at each course. */
const countByCourse = (records: RecordModel[]): Map<string, number> => {
  const counts = new Map<string, number>();
  for (const record of records) {
    const courseId = record.course as string;
    if (courseId) counts.set(courseId, (counts.get(courseId) ?? 0) + 1);
  }
  return counts;
};

/**
 * Annotates listed courses with their engagement counters, which the catalog
 * filters use for the "Participation" and "Rating" sorts.
 *
 * Both collections are read with a single list query for the whole batch, so the
 * cost does not grow with the number of courses. The counters are best-effort: if
 * a query fails the courses come back with zeroed counters instead of failing the
 * whole listing, since a missing sort key is not worth a broken catalog.
 */
export const withCourseStats = async <T extends RecordModel>(
  pb: PocketBase,
  courses: T[],
): Promise<(T & CourseStats)[]> => {
  if (courses.length === 0) return [];

  let participants = new Map<string, number>();
  let ratings = new Map<string, number>();

  try {
    const scope = courseScopeFilter(pb, courses.map(course => course.id));
    const [progress, rates] = await Promise.all([
      pb.collection('progress').getFullList({ filter: scope, fields: 'course' }),
      pb.collection('course_rates').getFullList({ filter: `(${scope}) && like = true`, fields: 'course' }),
    ]);
    participants = countByCourse(progress);
    ratings = countByCourse(rates);
  } catch (error) {
    console.error('Failed to load the course engagement counters:', error);
  }

  return courses.map(course => ({
    ...course,
    participants: participants.get(course.id) ?? 0,
    rating: ratings.get(course.id) ?? 0,
  }));
};
