<template>
    <div class="w-full base-height overflow-y-auto">
        <div class="max-w-6xl mx-auto px-8 py-6">
            <div v-if="pending && !currentSchool" class="space-y-4">
                <USkeleton class="h-20 w-full" />
                <USkeleton class="h-24 w-full" />
            </div>

            <div v-else-if="!currentSchool" class="flex flex-col items-start gap-4">
                <p class="text-red-500">{{ errorMessage || 'This dashboard is not available.' }}</p>
                <UButton :to="localePath('/')" color="neutral" variant="outline">Go home</UButton>
            </div>

            <template v-else>
                <!-- School identity + main actions -->
                <div class="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div class="flex items-center gap-4">
                        <UAvatar :src="logoUrl" :alt="currentSchool.name" icon="i-heroicons-academic-cap" size="3xl"
                            class="rounded-lg" />
                        <div>
                            <h1 class="text-3xl font-bold text-black dark:text-white">{{ currentSchool.name }}</h1>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('instructor_dashboard') }}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <UButton :to="localePath(`/school/${currentSchool.id}`)" icon="i-heroicons-eye" color="neutral"
                            variant="outline">
                            Public page
                        </UButton>
                        <UButton :to="localePath(`/dashboard/edit/${currentSchool.id}`)" icon="i-heroicons-pencil"
                            color="neutral" variant="outline">
                            Edit school
                        </UButton>
                        <UButton :to="localePath('/teach/new')" icon="i-heroicons-plus-circle">
                            New course
                        </UButton>
                    </div>
                </div>

                <!-- Stats -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div v-for="stat in stats" :key="stat.label"
                        class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                        <p class="text-2xl font-bold">{{ stat.value }}</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
                    </div>
                </div>

                <!-- Courses -->
                <UTabs v-model="activeTab" :items="tabs" class="w-full" variant="link">
                    <template #content="{ item }">
                        <div v-if="coursesFor(item.value).length === 0"
                            class="flex flex-col items-start gap-3 p-8 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                            <p class="text-gray-500 dark:text-gray-400">{{ emptyMessage(item.value) }}</p>
                            <UButton v-if="item.value === 'all'" :to="localePath('/teach/new')"
                                icon="i-heroicons-plus-circle">
                                Create your first course
                            </UButton>
                        </div>

                        <ul v-else class="divide-y divide-gray-200 dark:divide-gray-800">
                            <li v-for="course in coursesFor(item.value)" :key="course.id"
                                class="flex flex-wrap items-center justify-between gap-4 py-4">
                                <div class="flex items-start gap-3 min-w-0">
                                    <UIcon :name="typeIcon(course.type)" class="h-6 w-6 mt-1 text-blue-400 shrink-0" />
                                    <div class="min-w-0">
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <h3 class="font-semibold truncate">{{ course.title }}</h3>
                                            <UBadge :color="statusColor(course.status)" variant="subtle" size="sm">
                                                {{ statusLabel(course.status) }}
                                            </UBadge>
                                        </div>
                                        <p class="text-sm text-gray-500 dark:text-gray-400">
                                            {{ contentSummary(course) }} · Updated {{ course.updatedDate }}
                                        </p>
                                        <div v-if="course.tags?.length" class="flex flex-wrap gap-1 mt-1">
                                            <UBadge v-for="tag in course.tags" :key="tag.id" color="neutral"
                                                variant="outline" size="sm">
                                                {{ tag.name }}
                                            </UBadge>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center gap-2 ml-auto">
                                    <UButton :to="localePath(primaryAction(course).to)"
                                        :icon="primaryAction(course).icon" size="sm" variant="soft">
                                        {{ primaryAction(course).label }}
                                    </UButton>
                                    <UDropdownMenu :items="menuItems(course)" :content="{ align: 'end' }">
                                        <UButton icon="i-heroicons-ellipsis-vertical" color="neutral" variant="ghost"
                                            size="sm" />
                                    </UDropdownMenu>
                                </div>
                            </li>
                        </ul>
                    </template>
                </UTabs>
            </template>
        </div>

        <UModal v-model:open="isDeleteModalOpen" title="Delete this course?">
            <template #body>
                <p class="text-gray-600 dark:text-gray-300">
                    <b>{{ courseToDelete?.title }}</b> and its recordings will be permanently removed.
                    This cannot be undone.
                </p>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2 w-full">
                    <UButton color="neutral" variant="ghost" @click="isDeleteModalOpen = false">Cancel</UButton>
                    <UButton color="error" :loading="actionPending" @click="confirmDelete">Delete</UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem, TabsItem } from '#ui/types';
import type { DashboardCourse } from '~~/types/ui';

definePageMeta({
    middleware: 'auth',
    name: 'dashboard'
});

const route = useRoute();
const toast = useToast();
const localePath = useLocalePath();

const { currentSchool, dashboardCourses, pending, errorMessage, fetchDashboard } = useSchools();
const { setCourseStatus, deleteCourse, error: courseError } = useCourses();

const schoolId = computed(() => route.params.schoolId as string);

useHead({ title: () => currentSchool.value?.name ?? 'Dashboard' });
const logoUrl = computed(() => useFileUrl(currentSchool.value, 'logo', '200x200'));

const activeTab = ref('all');
const actionPending = ref(false);
const isDeleteModalOpen = ref(false);
const courseToDelete = ref<DashboardCourse | null>(null);

await useAsyncData(
    () => `dashboard-${schoolId.value}`,
    async () => await fetchDashboard(schoolId.value),
    { watch: [schoolId] }
);

// --- Course buckets ---

const isPublished = (course: DashboardCourse) => ['public', 'unlisted', 'private', 'student'].includes(course.status ?? '');

const coursesFor = (value?: string) => {
    if (value === 'draft') return dashboardCourses.value.filter(c => c.status === 'draft');
    if (value === 'published') return dashboardCourses.value.filter(isPublished);
    if (value === 'archived') return dashboardCourses.value.filter(c => c.status === 'archived');
    return dashboardCourses.value;
};

const tabs = computed<TabsItem[]>(() => [
    { label: `My Courses (${dashboardCourses.value.length})`, value: 'all', icon: 'i-heroicons-book-open' },
    { label: `Drafts (${coursesFor('draft').length})`, value: 'draft', icon: 'i-heroicons-pencil-square' },
    { label: `Published (${coursesFor('published').length})`, value: 'published', icon: 'i-heroicons-rocket-launch' },
    { label: `Archived (${coursesFor('archived').length})`, value: 'archived', icon: 'i-heroicons-archive-box' },
]);

const stats = computed(() => [
    { label: 'Courses', value: dashboardCourses.value.length },
    { label: 'Published', value: coursesFor('published').length },
    { label: 'Drafts', value: coursesFor('draft').length },
    { label: 'Recorded', value: dashboardCourses.value.filter(c => !!c.latestRecordingAt).length },
]);

const emptyMessage = (value?: string) => {
    if (value === 'draft') return 'No course in progress.';
    if (value === 'published') return 'Nothing published yet. Publish a draft to make it visible.';
    if (value === 'archived') return 'No archived course.';
    return 'You have not created any course in this school yet.';
};

// --- Presentation helpers ---

const typeIcon = (type?: string) => {
    if (type === 'cursus') return 'i-heroicons-list-bullet';
    if (type === 'live') return 'i-heroicons-video-camera';
    return 'i-heroicons-document-text';
};

const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    public: 'Published',
    unlisted: 'Unlisted',
    private: 'Private',
    student: 'Students only',
    archived: 'Archived',
};
const statusLabel = (status?: string) => STATUS_LABELS[status ?? ''] ?? 'Draft';

const statusColor = (status?: string) => {
    if (status === 'public') return 'success' as const;
    if (status === 'unlisted' || status === 'private' || status === 'student') return 'info' as const;
    return 'neutral' as const;
};

const contentSummary = (course: DashboardCourse) => {
    if (course.type === 'cursus') {
        return `${course.itemsCount} ${course.itemsCount === 1 ? 'course' : 'courses'} in the path`;
    }
    if (course.type === 'live') return 'Live session';
    if (!course.latestRecordingAt) return 'Not recorded yet';

    const recordedOn = new Date(course.latestRecordingAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
    });
    return `Recorded on ${recordedOn}`;
};

/** Route back into the creation flow for an existing course, optionally on a given step. */
const resumeRoute = (courseId: string, step?: string) => ({
    path: '/teach/new',
    query: step ? { course: courseId, step } : { course: courseId },
});

/** The next step the instructor is most likely to take for this course. */
const primaryAction = (course: DashboardCourse) => {
    if (isPublished(course)) {
        return { label: 'View', icon: 'i-heroicons-eye', to: `/catalog/course/${course.slug}` };
    }
    if (course.type === 'single' && !course.latestRecordingAt) {
        return { label: 'Record', icon: 'i-uim:record-audio', to: resumeRoute(course.id) };
    }
    if (course.type === 'cursus' && course.itemsCount === 0) {
        return { label: 'Organize', icon: 'i-heroicons-list-bullet', to: resumeRoute(course.id) };
    }
    return { label: 'Publish', icon: 'i-heroicons-rocket-launch', to: resumeRoute(course.id, 'publish') };
};

const menuItems = (course: DashboardCourse): DropdownMenuItem[][] => {
    const items: DropdownMenuItem[][] = [[
        {
            label: 'Edit details',
            icon: 'i-heroicons-pencil-square',
            to: localePath(resumeRoute(course.id)),
        },
    ]];

    if (course.type === 'single') {
        items[0]!.push({
            label: 'Open recorder',
            icon: 'i-uim:record-audio',
            to: localePath(`/teach/${course.slug}`),
        });
    }

    if (isPublished(course)) {
        items.push([
            { label: 'Unpublish', icon: 'i-heroicons-eye-slash', onSelect: () => changeStatus(course, 'draft') },
        ]);
    } else if (course.status !== 'archived') {
        items.push([
            { label: 'Publish', icon: 'i-heroicons-rocket-launch', onSelect: () => changeStatus(course, 'public') },
        ]);
    }

    items.push([
        course.status === 'archived'
            ? { label: 'Restore to draft', icon: 'i-heroicons-arrow-uturn-left', onSelect: () => changeStatus(course, 'draft') }
            : { label: 'Archive', icon: 'i-heroicons-archive-box', onSelect: () => changeStatus(course, 'archived') },
        {
            label: 'Delete',
            icon: 'i-heroicons-trash',
            color: 'error' as const,
            onSelect: () => askDelete(course),
        },
    ]);

    return items;
};

// --- Actions ---

const changeStatus = async (course: DashboardCourse, status: string) => {
    actionPending.value = true;
    const result = await setCourseStatus(course.id, status);
    actionPending.value = false;

    if (!result) {
        toast.add({
            title: 'Could not update the course',
            description: getApiErrorMessage(courseError.value, 'Please try again.'),
            color: 'error',
            icon: 'i-heroicons-exclamation-triangle',
        });
        return;
    }

    toast.add({ title: `"${course.title}" is now ${statusLabel(status).toLowerCase()}.`, color: 'success' });
    await fetchDashboard(schoolId.value);
};

const askDelete = (course: DashboardCourse) => {
    courseToDelete.value = course;
    isDeleteModalOpen.value = true;
};

const confirmDelete = async () => {
    if (!courseToDelete.value) return;

    actionPending.value = true;
    const result = await deleteCourse(courseToDelete.value.id);
    actionPending.value = false;
    isDeleteModalOpen.value = false;

    if (!result) {
        toast.add({
            title: 'Could not delete the course',
            description: getApiErrorMessage(courseError.value, 'Please try again.'),
            color: 'error',
            icon: 'i-heroicons-exclamation-triangle',
        });
        return;
    }

    toast.add({ title: 'Course deleted.', color: 'success' });
    courseToDelete.value = null;
    await fetchDashboard(schoolId.value);
};
</script>
