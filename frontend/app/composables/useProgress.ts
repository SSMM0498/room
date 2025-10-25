export interface InProgressCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  progress: number;
  currentTime: number;
  duration: number;
  tags: any[];
  updatedAt: string;
}

export const useProgress = () => {
  const inProgressCourses = useState<InProgressCourse[]>('in-progress-courses', () => []);
  const pending = ref(false);
  const error = ref<Error | null>(null);

  const fetchInProgressCourses = async () => {
    pending.value = true;
    error.value = null;
    try {
      const data = await $fetch<InProgressCourse[]>('/api/progress/in-progress');
      inProgressCourses.value = data;
      return data;
    } catch (err: any) {
      error.value = err;
      console.error('Error fetching in-progress courses:', err);
      return [];
    } finally {
      pending.value = false;
    }
  };

  return {
    inProgressCourses,
    pending,
    error,
    fetchInProgressCourses,
  };
};
