import type { School } from '~~/types/ui';

export const useSchools = () => {
    // --- State ---
    const currentSchool = ref<School | null>(null);
    const pending = ref(false);
    const error = ref<Error | null>(null);

    // --- Helper for API Requests ---
    const _handleRequest = async <T>(request: () => Promise<T>): Promise<T | null> => {
        pending.value = true;
        error.value = null;
        try {
            return await request();
        } catch (err: any) {
            error.value = err;
            return null;
        } finally {
            pending.value = false;
        }
    };

    // --- School Management ---

    /**
     * Fetches a single school by its ID.
     * @param id The ID of the school to fetch.
     */
    // const getSchoolById = (id: string) => _handleRequest(async () => {
    //     const school = await $fetch<School>(`/api/schools/${id}`);
    //     currentSchool.value = school;
    //     return school;
    // });

    /**
     * Finds the school owned by the current user, or creates a new one if it doesn't exist.
     * This is the primary method for a user to access their school workspace.
     */
    const getOrCreateSchool = () => _handleRequest(async () => {
        const school = await $fetch<School>('/api/schools/get-or-create', {
            method: 'POST',
        });
        currentSchool.value = school;
        return school;
    });

    // --- Course Management (in the context of the current school) ---

    /**
     * Creates a new course and associates it with a specific school.
     * @param schoolId The ID of the school to which the course will belong.
     * @param courseData The data for the new course.
     */
    // const createCourseInSchool = (schoolId: string, courseData: Omit<CourseCard, 'id'>) => _handleRequest(async () => {
    //     // This endpoint encapsulates the logic of creating a course and linking it to the school.
    //     const newCourse = await $fetch<RecordModel>(`/api/schools/${schoolId}/courses`, {
    //         method: 'POST',
    //         body: courseData,
    //     });
        
    //     // Optionally, refresh the school data to include the new course
    //     await getSchoolById(schoolId);
        
    //     return newCourse;
    // });

    /**
     * Updates an existing course.
     * Note: This often redirects to the main course API, but is provided here for convenience.
     * @param courseId The ID of the course to update.
     * @param courseData The data to update.
     */
    // const updateCourse = (courseId: string, courseData: Partial<CourseCard>) => _handleRequest(async () => {
    //     // This typically proxies to the main course endpoint.
    //     const updatedCourse = await $fetch<RecordModel>(`/api/courses/${courseId}`, {
    //         method: 'PATCH',
    //         body: courseData,
    //     });
    //     // Refresh school data if needed
    //     if (currentSchool.value) {
    //         await getSchoolById(currentSchool.value.id);
    //     }
    //     return updatedCourse;
    // });

    /**
     * Deletes a course.
     * Note: This also often redirects to the main course API.
     * @param courseId The ID of the course to delete.
     */
    // const deleteCourse = (courseId: string) => _handleRequest(async () => {
    //     await $fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
    //     // Refresh school data to remove the course from the list
    //     if (currentSchool.value) {
    //         await getSchoolById(currentSchool.value.id);
    //     }
    //     return true;
    // });


    return {
        // State
        // currentSchool,
        pending,
        error,

        // School Methods
        // getSchoolById,
        getOrCreateSchool,
        
        // Course Methods (scoped to a school context)
        // createCourseInSchool,
        // updateCourse,
        // deleteCourse,
    };
};