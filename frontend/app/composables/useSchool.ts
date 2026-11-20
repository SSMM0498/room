import type { RecordModel } from 'pocketbase';
import type { CourseCard, DashboardCourse, School, SchoolDashboardData, SchoolPageData } from '~~/types/ui';
import { parseCourseRecordToCard } from '~/composables/useCourses';

/**
 * Parses a raw course record coming from the dashboard endpoint, which annotates
 * each course with its recording and cursus information.
 */
const parseDashboardCourse = (record: RecordModel): DashboardCourse => ({
    ...parseCourseRecordToCard(record),
    updatedDate: record.updated
        ? new Date(record.updated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : '',
    latestRecordingAt: record.latestRecordingAt ?? null,
    itemsCount: record.itemsCount ?? 0,
});

export const useSchools = () => {
    // --- State (shared, so the page and its side panel read the same school) ---
    const authUser = useAuthUser();
    const currentSchool = useState<School | null>('school-current', () => null);
    const schoolCourses = useState<CourseCard[]>('school-courses', () => []);
    const dashboardCourses = useState<DashboardCourse[]>('school-dashboard-courses', () => []);
    const pending = useState<boolean>('school-pending', () => false);
    const errorMessage = useState<string | null>('school-error', () => null);

    // --- Helper for API Requests ---
    const _handleRequest = async <T>(request: () => Promise<T>, fallbackError: string): Promise<T | null> => {
        pending.value = true;
        errorMessage.value = null;
        try {
            return await request();
        } catch (err) {
            errorMessage.value = getApiErrorMessage(err, fallbackError);
            return null;
        } finally {
            pending.value = false;
        }
    };

    // --- School Management ---

    /**
     * Fetches a school and its public courses.
     * @param id The ID of the school to fetch.
     */
    const fetchSchool = (id: string) => _handleRequest(async () => {
        const raw = await $fetch<{ school: School; courses: RecordModel[] }>(`/api/schools/${id}`);
        currentSchool.value = raw.school;
        schoolCourses.value = raw.courses.map(parseCourseRecordToCard);
        return { school: raw.school, courses: schoolCourses.value } as SchoolPageData;
    }, 'Could not load this school.');

    /**
     * Fetches the owner-only dashboard data: the school plus every course the
     * instructor authored in it, drafts included.
     * @param id The ID of the school.
     */
    const fetchDashboard = (id: string) => _handleRequest(async () => {
        const raw = await $fetch<{ school: School; courses: RecordModel[] }>(`/api/schools/${id}/dashboard`);
        currentSchool.value = raw.school;
        dashboardCourses.value = raw.courses.map(parseDashboardCourse);
        return { school: raw.school, courses: dashboardCourses.value } as SchoolDashboardData;
    }, 'Could not load the dashboard.');

    /**
     * Updates a school. The payload is multipart so it can carry the logo and banner files.
     * @param id The ID of the school to update.
     * @param data The form data holding the fields to update.
     */
    const updateSchool = (id: string, data: FormData) => _handleRequest(async () => {
        const school = await $fetch<School>(`/api/schools/${id}`, {
            method: 'PATCH',
            body: data,
        });
        currentSchool.value = school;

        // Keep the copy carried by the session in sync (the header and the course flow read it).
        if (authUser.value?.school?.id === school.id) {
            authUser.value.school = school;
        }

        return school;
    }, 'Failed to update the school.');

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
    }, 'Could not load your school.');

    /**
     * Returns the school of the logged-in user, creating it on the fly if the session
     * doesn't carry one yet (it is only attached on app start, not right after a login).
     */
    const ensureUserSchool = async (): Promise<School | null> => {
        if (authUser.value?.school?.id) {
            return authUser.value.school as School;
        }

        const school = await getOrCreateSchool();
        if (school && authUser.value) {
            authUser.value.school = school;
        }
        return school;
    };

    return {
        // State
        currentSchool,
        schoolCourses,
        dashboardCourses,
        pending,
        errorMessage,

        // School Methods
        fetchSchool,
        fetchDashboard,
        updateSchool,
        getOrCreateSchool,
        ensureUserSchool,
    };
};
