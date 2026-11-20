import type { RecordModel } from 'pocketbase';

export interface CourseCard {
  id: string;
  title: string;
  slug: string;
  description: string;
  type?: string;
  status?: string;
  createdDate: string;
  /** Raw ISO creation date, kept next to `createdDate` so the catalog can sort on it. */
  createdAt: string;
  durationFormatted: string;
  /** Raw duration in seconds, kept next to `durationFormatted` so the catalog can filter on it. */
  durationSeconds: number;
  /** Learners who started the course — drives the "Participation" sort. */
  participants: number;
  /** Likes the course collected — drives the "Rating" sort. */
  rating: number;
  items?: RecordModel[];
  price?: number;
  section: string;
  tags: RecordModel[];
  author?: RecordModel;
  /** The school publishing the course, shown alongside the author on the listing cards. */
  school?: RecordModel;
}

export interface School extends RecordModel {
  name: string;
  description?: string;
  owner: string; // User ID
  logo?: string;
  banner?: string;
  topics?: string[]; // Tag IDs
}

export interface SchoolPageData {
  school: School;
  courses: CourseCard[];
}

/** A course as listed in the instructor dashboard, with its production state. */
export interface DashboardCourse extends CourseCard {
  updatedDate: string;
  /** ISO date of the latest recording uploaded for this course, if any. */
  latestRecordingAt: string | null;
  /** Number of courses inside this cursus. */
  itemsCount: number;
}

export interface SchoolDashboardData {
  school: School;
  courses: DashboardCourse[];
}

export interface Workspace {
  id: string;
  name: string;
  language: string;
  status: string;
}

export interface UserProfileData {
  user: RecordModel | null;
  school: RecordModel | null;
  courses: CourseCard[];
}

export type SimpleCourse = {
  id: string;
  title: string;
  slug: string;
  tags: RecordModel[];
};

export type Section = {
  title: string;
  courses: CourseCard[];
};