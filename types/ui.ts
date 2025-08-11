import type { RecordModel } from 'pocketbase';

export interface CourseCard {
  id: string;
  title: string;
  description: string;
  type?: string;
  createdDate: string;
  durationFormatted: string;
  price?: number;
  section: string;
  tags: RecordModel[];
  author?: RecordModel; 
}

export type Section = {
  title: string;
  courses: CourseCard[];
};