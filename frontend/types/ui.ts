import type { RecordModel } from 'pocketbase';

export interface CourseCard {
  id: string;
  title: string;
  slug: string;
  description: string;
  type?: string;
  createdDate: string;
  durationFormatted: string;
  items: RecordModel[];
  price?: number;
  section: string;
  tags: RecordModel[];
  author?: RecordModel; 
}

export type Section = {
  title: string;
  courses: CourseCard[];
};