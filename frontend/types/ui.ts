import type { RecordModel } from 'pocketbase';

export interface CourseCard {
  id: string;
  title: string;
  slug: string;
  description: string;
  type?: string;
  status?: string;
  createdDate: string;
  durationFormatted: string;
  items?: RecordModel[];
  price?: number;
  section: string;
  tags: RecordModel[];
  author?: RecordModel;
}

export interface School extends RecordModel {
  name: string;
  owner: string; // User ID
  // members?: string[]; // Array of User IDs
  // courses?: string[]; // Array of Course IDs
  // expand?: {
  //   'courses(school)': CourseCard[];
  //   owner: RecordModel; // User Record
  // }
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