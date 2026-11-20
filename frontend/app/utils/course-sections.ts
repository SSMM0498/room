import type { RecordModel } from 'pocketbase';
import type { CourseCard, Section } from '~~/types/ui';

/**
 * Groups courses into one section per tag, in the order the tags first appear.
 * A course carrying several tags shows up in each of their sections.
 *
 * @param courses The courses to group.
 * @param fallbackTitle Title of the section collecting the courses without tags.
 */
export const groupCoursesByTag = (courses: CourseCard[], fallbackTitle = 'Other Courses'): Section[] => {
  const sections: Section[] = [];

  const tags = new Map<string, RecordModel>();
  courses.forEach(course => course.tags?.forEach((tag) => {
    if (tag?.id && tag.name && !tags.has(tag.id)) tags.set(tag.id, tag);
  }));

  for (const tag of tags.values()) {
    const taggedCourses = courses.filter(course => course.tags?.some(t => t?.id === tag.id));
    if (taggedCourses.length > 0) {
      sections.push({
        title: tag.name,
        courses: taggedCourses.map(course => ({ ...course, section: tag.name })),
      });
    }
  }

  const untaggedCourses = courses.filter(course => !course.tags || course.tags.length === 0);
  if (untaggedCourses.length > 0) {
    sections.push({
      title: fallbackTitle,
      courses: untaggedCourses.map(course => ({ ...course, section: fallbackTitle })),
    });
  }

  return sections;
};
