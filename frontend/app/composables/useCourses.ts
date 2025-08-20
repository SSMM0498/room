import { ref } from 'vue';
import { type RecordModel } from 'pocketbase';
import type { CourseCard } from '~~/types/ui';

/**
 * Parses a raw PocketBase course record into a clean CourseCard object
 * suitable for use in frontend components.
 *
 * @param record - The raw RecordModel object from a PocketBase fetch request.
 * @returns A formatted CourseCard object.
 */
export const parseCourseRecordToCard = (record: RecordModel): CourseCard => {
    const tags = record.expand?.tags || [];

    const durationInMinutes = record.duration ? Math.round(record.duration / 60) : 0;
    const durationFormatted = `${durationInMinutes} min`;

    const createdDate = record.created
        ? new Date(record.created).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        : '';

    return {
        id: record.id,
        title: record.title,
        slug: record.slug,
        description: record.description,
        type: record.type,
        createdDate,
        section: '',
        durationFormatted,
        tags,
        items: record.items || [],
        author: record.expand?.author, // Embed the expanded author record
        price: record.price,
    };
};

export const useCourses = () => {
    const courses = ref<CourseCard[]>([]);
    const currentCourse = ref<CourseCard | null>(null);
    const currentItemIndex = ref(0);
    const activePlaylistItem = computed(() => {
        if (
            currentCourse.value?.type === 'cursus' &&
            currentCourse.value.items &&
            currentCourse.value.items.length > currentItemIndex.value
        ) {
            return currentCourse.value.items[currentItemIndex.value];
        }
        return null;
    });

    const pending = ref(false);
    const error = ref<Error | null>(null);

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

    const fetchCourses = async () => _handleRequest(async () => {
        console.trace("fetch courses");
        const rawCourses = await $fetch<RecordModel[]>('/api/courses');
        courses.value = rawCourses.map(parseCourseRecordToCard);
        return courses.value;
    });

    const fetchCourseById = async (id: string) => _handleRequest(async () => {
        const course = await $fetch<RecordModel>(`/api/courses/${id}`);
        currentCourse.value = parseCourseRecordToCard(course);
        return course;
    });

    const fetchCourseBySlug = async (slug: string) => _handleRequest(async () => {
        const course = await $fetch<RecordModel>(`/api/courses/slug/${slug}`);
        currentCourse.value = parseCourseRecordToCard(course);
        return course;
    });

    const generateSlug = (title: string): string => {
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        return title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove non-word chars
            .replace(/[\s_-]+/g, '-') // Swap spaces for -
            .replace(/^-+|-+$/g, '') + '-' + randomSuffix; // Remove leading/trailing dashes and add random suffix
    };

    const createCourse = async (data: Partial<RecordModel>) => _handleRequest(async () => {
        if (data.title && !data.slug) {
            data.slug = generateSlug(data.title);
        }
        const newCourse = await $fetch<RecordModel>('/api/courses', {
            method: 'POST',
            body: data,
        });
        courses.value.unshift(parseCourseRecordToCard(newCourse));
        return newCourse;
    });

    const updateCourse = async (id: string, data: Partial<RecordModel>) => _handleRequest(async () => {
        const updatedCourse = await $fetch<RecordModel>(`/api/courses/${id}`, {
            method: 'PATCH',
            body: data,
        });
        const index = courses.value.findIndex(c => c.id === id);
        if (index !== -1) {
            courses.value[index] = parseCourseRecordToCard(updatedCourse);
        }
        if (currentCourse.value?.id === id) {
            currentCourse.value = parseCourseRecordToCard(updatedCourse);
        }
        return updatedCourse;
    });

    const deleteCourse = async (id: string) => _handleRequest(async () => {
        await $fetch(`/api/courses/${id}`, { method: 'DELETE' });
        courses.value = courses.value.filter(c => c.id !== id);
        return true;
    });

    const toggleCourseType = async (courseId: string, currentType: 'single' | 'cursus') => _handleRequest(async () => {
        const newType = currentType === 'single' ? 'cursus' : 'single';
        return await updateCourse(courseId, { type: newType });
    });

    const addCourseToCursus = async (cursusId: string, courseIdToAdd: string) => _handleRequest(async () => {
        const newItem = await $fetch<RecordModel>(`/api/cursus/${cursusId}/items`, {
            method: 'POST',
            body: { courseIdToAdd },
        });

        await fetchCourseById(cursusId);
        return newItem;
    });

    const removeCourseFromCursus = async (itemId: string) => _handleRequest(async () => {
        await $fetch(`/api/cursus/items/${itemId}`, { method: 'DELETE' });
        if (currentCourse.value && currentCourse.value.items) {
            currentCourse.value.items = currentCourse.value.items.filter((item: any) => item.id !== itemId);
        }
        return true;
    });

    const updateCursusOrder = async (cursusId: string, orderedItemIds: string[]) => _handleRequest(async () => {
        if (currentCourse.value && currentCourse.value.items) {
            const newOrderedItems = orderedItemIds.map(id =>
                currentCourse.value!.items!.find((item: any) => item.id === id)
            ).filter(Boolean); // Filter out any undefined items
            if (newOrderedItems.length) {
                currentCourse.value.items = newOrderedItems as typeof currentCourse.value.items;
            }
        }
        console.warn("API for reordering not implemented. UI reordered only.");

        return await $fetch<any>(`/api/cursus/${cursusId}/order`, {
            method: 'PATCH',
            body: orderedItemIds,
        });
    });

    return {
        // State
        courses,
        currentCourse,
        currentItemIndex,
        activePlaylistItem,
        pending,
        error,

        // Methods
        fetchCourses,
        fetchCourseById,
        fetchCourseBySlug,
        createCourse,
        updateCourse,
        deleteCourse,
        generateSlug,
        toggleCourseType,
        addCourseToCursus,
        removeCourseFromCursus,
        updateCursusOrder,
    };
};