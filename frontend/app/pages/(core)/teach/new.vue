<template>
    <div class="w-full base-height flex items-start justify-start">
        <div
            class="lg:w-4/5 px-8 py-4 h-full lg:border-r border-gray-200 dark:border-gray-800 overflow-y-auto w-full border-0">
            <h1 class="text-3xl font-bold mb-8 text-black dark:text-white">New Course</h1>

            <UStepper v-model="currentStep" :items="steps" class="w-full" orientation="vertical">

                <template #type>
                    <UCard>
                        <template #header>
                            <div class="flex w-full items-center justify-between">
                                <h3 class="text-lg font-semibold">{{ steps[0]!.description }}</h3>
                                <UButton @click="() => handleStartWorkspace('rgtf74rqqa8uegl')"
                                    label="Start Workspace" />
                            </div>
                        </template>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div @click="handleSelectType('single')"
                                class="h-[300px] flex items-start justify-end flex-col p-6 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer transition-all"
                                :class="courseState.type === 'single' ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/25' : 'hover:bg-gray-50 dark:hover:bg-gray-800'">
                                <UIcon name="i-heroicons-document-text" class="w-15 h-15 text-blue-300 mb-2" />
                                <h4 class="font-semibold text-lg">Single Course</h4>
                                <p class="text-sm text-gray-500 dark:text-gray-400">A standard course with video
                                    lessons, code, and text, recorded in a dedicated environment.</p>
                            </div>
                            <div @click="handleSelectType('cursus')"
                                class="h-[300px] flex items-start justify-end flex-col p-6 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer transition-all"
                                :class="courseState.type === 'cursus' ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/25' : 'hover:bg-gray-50 dark:hover:bg-gray-800'">
                                <UIcon name="i-heroicons-list-bullet" class="w-15 h-15 text-blue-300 mb-2" />
                                <h4 class="font-semibold text-lg">Cursus / Path</h4>
                                <p class="text-sm text-gray-500 dark:text-gray-400">A collection of existing courses or
                                    articles organized into a guided learning path.</p>
                            </div>
                            <div @click="handleSelectType('live')"
                                class="h-[300px] flex items-start justify-end flex-col p-6 border border-gray-200 dark:border-gray-800 rounded-lg cursor-pointer transition-all"
                                :class="courseState.type === 'live' ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/25' : 'hover:bg-gray-50 dark:hover:bg-gray-800'">
                                <UIcon name="i-heroicons-video-camera" class="w-15 h-15 text-blue-300 mb-2" />
                                <h4 class="font-semibold text-lg">Live Session</h4>
                                <p class="text-sm text-gray-500 dark:text-gray-400">Schedule a live-streamed event with
                                    a
                                    set date and maximum number of participants.</p>
                            </div>
                        </div>
                    </UCard>
                </template>

                <template #course>
                    <UCard>
                        <template #header>
                            <h3 class="text-lg font-semibold">{{ steps[1]!.description }}</h3>
                        </template>
                        <UForm :schema="courseSchema" :state="courseState" @submit="handleCreateCourse"
                            class="space-y-4 w-full">
                            <UFormField class="w-full" label="Course Title" name="title" size="lg" required>
                                <UInput class="w-full" v-model="courseState.title"
                                    placeholder="e.g., Introduction to Go" />
                            </UFormField>
                            <UFormField class="w-full" label="Description" name="description" required>
                                <UTextarea class="w-full" placeholder="Description of the course"
                                    v-model="courseState.description" :rows="8" />
                            </UFormField>
                            <UFormField class="w-full" label="Tags" name="tags" required>
                                <USelectMenu class="w-full" v-model="courseState.tags" :items="tagOptions" multiple
                                    searchable placeholder="Select technologies" size="lg" :ui="{
                                        group: 'flex flex-row items-start justify-start gap-2 flex-wrap p-2',
                                        item: 'm-0 p-0 w-auto'
                                    }" :content="{ side: 'top' }">
                                    <template #default="{ modelValue }">
                                        <widget-tag v-for="(item, i) in modelValue" :key="i" class="m-0">
                                            {{ item.label }}
                                            <UButton squared class="cursor-pointer" icon="i-heroicons-x-mark-20-solid"
                                                size="xs" color="error" variant="link" :ui="{ base: 'p-0' }"
                                                @click="(e) => removeTag(e, item.label)"></UButton>
                                        </widget-tag>
                                    </template>
                                    <template #item="{ item }">
                                        <widget-tag
                                            :class="{ 'ring-2 ring-blue-400': courseState.tags.find((tag) => tag.label == item.label) }"
                                            class="m-0">
                                            {{ item.label }}
                                        </widget-tag>
                                    </template>
                                </USelectMenu>
                            </UFormField>
                            <div class="flex w-full items-center justify-start gap-2">
                                <UButton class="w-1/6" @click="(e: MouseEvent) => { currentStep-- }" variant="link"
                                    color="neutral">
                                    Back
                                </UButton>
                                <UButton class="w-5/6 flex items-center justify-center" type="submit"
                                    :loading="coursePending">
                                    Next
                                </UButton>
                            </div>
                        </UForm>
                    </UCard>
                </template>


                <!-- Step 3 (Conditional): Workspace Config for 'single' type -->
                <template #workspace>
                    <UCard>
                        <template #header>
                            <h3 class="text-lg font-semibold">{{ steps[2]!.description }}</h3>
                        </template>
                        <UForm :schema="workspaceSchema" :state="workspaceState" @submit="handleCreateWorkspace"
                            class="space-y-4">
                            <p class="text-sm text-gray-500">
                                This workspace will be linked to your course. It's the environment where you'll record
                                your lesson.
                            </p>
                            <div class="flex items-center justify-center gap-2">
                                <UFormField class="w-full" label="Workspace Name" name="name" required>
                                    <UInput class="w-full" v-model="workspaceState.name" disabled />
                                </UFormField>
                                <UFormField class="w-full" label="Primary Language" name="language" required>
                                    <USelectMenu class="w-full" v-model="workspaceState.language" :items="tagOptions"
                                        value-key="value" searchable placeholder="Select primary language" size="lg"
                                        :ui="{
                                            group: 'flex flex-row items-start justify-start gap-2 flex-wrap p-2',
                                            item: 'm-0 p-0 w-auto'
                                        }" :content="{ side: 'top' }">
                                        <template #item="{ item }">
                                            <widget-tag
                                                :class="{ 'ring-2 ring-blue-400': courseState.tags.find((tag) => tag.label == item.label) }"
                                                class="m-0">
                                                {{ item.label }}
                                            </widget-tag>
                                        </template>
                                    </USelectMenu>
                                </UFormField>
                            </div>
                            <div class="flex w-full items-center justify-start gap-2">
                                <UButton class="w-1/6" @click="(e: MouseEvent) => { currentStep-- }" variant="link"
                                    color="neutral">
                                    Back
                                </UButton>
                                <UButton class="w-5/6 flex items-center justify-center" type="submit"
                                    :loading="workspacePending">
                                    Next
                                </UButton>
                            </div>
                        </UForm>
                    </UCard>
                </template>

                <!-- Step 3 (Conditional): Cursus/Live Config -->
                <template #configure>
                    <UCard>
                        <template #header>
                            <div class="flex items-center justify-between">
                                <h3 class="text-lg font-semibold">{{ steps[2]!.description }}</h3>
                            </div>
                        </template>

                        <!-- Cursus Configuration -->
                        <div v-if="courseState.type === 'cursus'" class="space-y-6">
                            <!-- Add Course Section -->
                            <div class="flex items-end gap-2">
                                <UFormField label="Add a course to your cursus" class="flex-grow">
                                    <USelectMenu v-model="selectedCourseToAdd" :items="userCourseOptions" searchable
                                        :loading="coursePending" placeholder="Search for a course you created..."
                                        value-key="id" />
                                </UFormField>
                                <UButton @click="handleAddItemToCursus" :disabled="!selectedCourseToAdd"
                                    :loading="coursePending" icon="i-heroicons-plus-circle" size="lg">
                                    Add</UButton>
                            </div>

                            <!-- Draggable List of Courses -->
                            <div
                                class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg min-h-[200px] relative">
                                <div v-if="coursePending"
                                    class="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-10">
                                    <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8" />
                                </div>
                                <p v-if="!cursusItems || cursusItems.length === 0"
                                    class="text-sm text-gray-500 text-center">
                                    No courses added yet. Use the search bar above to add courses to this cursus.
                                </p>
                                <draggable v-else v-model="cursusItems" item-key="id" handle=".handle"
                                    class="space-y-2">
                                    <template #item="{ element }">
                                        <div
                                            class="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md justify-between">
                                            <div class="flex items-center gap-3">
                                                <UIcon name="i-heroicons-bars-2"
                                                    class="handle cursor-grab text-gray-400" />
                                                <span class="font-medium">{{ element.expand.course.title }}</span>
                                            </div>
                                            <UButton @click="handleRemoveItemFromCursus(element.id)" color="error"
                                                variant="ghost" icon="i-heroicons-x-circle" :loading="coursePending" />
                                        </div>
                                    </template>
                                </draggable>
                            </div>
                        </div>

                        <!-- Placeholder for Live Configuration -->
                        <div v-if="courseState.type === 'live'">
                            <UForm :schema="liveSchema" :state="courseState" @submit="handleSaveLiveSession"
                                class="space-y-6">
                                <!-- Scheduled Date -->
                                <UFormField label="Scheduled Date and Time" name="scheduled_date" required>
                                    <div class="flex items-center gap-2">
                                        <widget-date-picker v-model.date="liveDate" />
                                        <UInput v-model.number="liveTime.hours" type="number" placeholder="HH" :min="0"
                                            :max="23" />
                                        <span>:</span>
                                        <UInput v-model.number="liveTime.minutes" type="number" placeholder="MM"
                                            :min="0" :max="59" />
                                    </div>
                                </UFormField>

                                <div class="grid grid-cols-2 gap-4">
                                    <!-- Max Participants -->
                                    <UFormField label="Max Participants" name="max_participants" required>
                                        <UInput v-model.number="courseState.max_participants" type="number" />
                                    </UFormField>
                                    <!-- Expected Duration -->
                                    <UFormField label="Expected Duration (minutes)" name="duration" required>
                                        <UInput v-model.number="courseState.duration" type="number" />
                                    </UFormField>
                                </div>

                                <!-- Live Finish Button -->
                                <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <UButton type="submit" size="lg" icon="i-heroicons-check-circle"
                                        :loading="coursePending">
                                        Save and Finish
                                    </UButton>
                                </div>
                            </UForm>
                        </div>
                    </UCard>
                </template>

                <!-- Step 4 (Conditional): Launch Environment for 'single' type -->
                <template #launch>
                    <UCard>
                        <template #header>
                            <h3 class="text-lg font-semibold">{{ steps[3]!.description }}</h3>
                        </template>
                        <div class="space-y-4">
                            <div v-if="isStarting" class="text-center p-4">
                                <p class="text-sm text-gray-500 mb-2">This may take a minute. We're provisioning your
                                    dedicated cloud environment.</p>
                                <UProgress animation="carousel" />
                                <p class="text-sm text-gray-500 mt-2">Please do not navigate away from this page.</p>
                            </div>
                            <div v-else class="flex flex-col items-start gap-4">
                                <div class="flex items-center gap-2 text-green-500">
                                    <UIcon name="i-heroicons-check-circle-20-solid" class="h-6 w-6" />
                                    <p class="font-semibold">Workspace is configured and ready to launch.</p>
                                </div>
                                <UButton @click="() => handleStartWorkspace()" size="lg"
                                    icon="i-heroicons-arrow-right-end-on-rectangle">
                                    Start and Enter IDE
                                </UButton>
                            </div>
                        </div>
                    </UCard>
                </template>

                <!-- No default content needed as we use named slots -->
                <template #content />
            </UStepper>
        </div>
        <div class="lg:w-1/4 p-8 h-full lg:flex items-center justify-center hidden">
            <widget-card class="w-full h-full" :course="coursePreview" v-if="coursePreview" :is-preview="true" />
        </div>
    </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable';
import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
import { z } from 'zod';
import { type RecordModel } from 'pocketbase';
import type { StepperItem } from '#ui/types';
import type { CourseCard } from '~~/types/ui';

definePageMeta({ middleware: 'auth' });

type CourseType = 'single' | 'cursus' | 'live';

const { createCourse, currentCourse, pending: coursePending, fetchUserCoursesList, userCoursesList, addCourseToCursus, removeCourseFromCursus, updateCursusOrder } = useCourses();
const { createWorkspace, startWorkspace, isStarting } = useWorkspace();
const { tags } = useTags();
const toast = useToast();
const user = useAuthUser();
const localePath = useLocalePath();

const createdWorkspace = ref<RecordModel | null>(null);
const workspacePending = ref(false);
const currentStep = ref(0)
const selectedCourseToAdd = ref<string>('');
const cursusItems = computed({
    get() {
        return currentCourse.value?.items || [];
    },
    async set(newItems) {
        if (!currentCourse.value) return;

        const orderedItemIds = newItems.map((item: any) => item.id);

        await updateCursusOrder(currentCourse.value.id, orderedItemIds);
    }
});

const coursePreview = computed<CourseCard>(() => {
    const selectedTags = tags.value.filter(tag => courseState.tags.includes(tag.id));

    return {
        id: 'preview',
        title: courseState.title || 'Your Course Title',
        description: courseState.description || 'A great description for your course will appear here.',
        tags: selectedTags,
        author: { // Use the logged-in user's data for the author preview
            id: user.value?.id || 'preview-author',
            username: user.value?.username || 'Author',
            avatar: user.value?.avatar || '',
            collectionId: user.value?.collectionId,
            collectionName: user.value?.collectionName
        },
        durationFormatted: '',
        createdDate: 'Today',
        section: 'preview',
        type: courseState.type || 'cursus',
        slug: 'preview-slug'
    } as CourseCard;
});

const steps = computed<StepperItem[]>(() => {
    const baseSteps: StepperItem[] = [
        { slot: 'type', label: 'Course Type', icon: 'i-heroicons-swatch', description: 'Select the format of your course' },
        { slot: 'course', label: 'Course Info', icon: 'i-heroicons-book-open', description: 'Describe your new course', disabled: !courseState.type },
    ];

    let dynamicSteps: StepperItem[] = [];

    switch (courseState.type) {
        case 'single':
            dynamicSteps = [
                { slot: 'workspace', label: 'Workspace', icon: 'i-heroicons-computer-desktop', description: 'Configure the recording environment', disabled: !currentCourse.value },
                { slot: 'launch', label: 'Launch', icon: 'i-heroicons-rocket-launch', description: 'Start the cloud IDE', disabled: !createdWorkspace.value }
            ];
            break;
        case 'cursus':
            dynamicSteps = [
                { slot: 'configure', label: 'Organize', icon: 'i-heroicons-list-bullet', description: 'Organize the items in your cursus', disabled: !currentCourse.value }
            ];
            break;
        case 'live':
            dynamicSteps = [
                { slot: 'configure', label: 'Schedule', icon: 'i-heroicons-calendar-days', description: 'Configure your live session', disabled: !currentCourse.value }
            ];
            break;
    }

    return [...baseSteps, ...dynamicSteps];
});

const liveDate = ref(new CalendarDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
const liveTime = reactive({ hours: 18, minutes: 0 });

const courseState = reactive({
    title: '',
    description: '',
    tags: [] as any[],
    type: 'single' as CourseType | '',
    scheduled_date: null as Date | null,
    max_participants: 50,
    duration: 60, // in minutes
});
const courseSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    description: z.string().min(10, 'Description is required'),
    tags: z.array(z.object({
        label: z.string(),
        value: z.string(),
    })).min(1, 'At least one tag is required'),
});
const liveSchema = z.object({
    max_participants: z.number().positive('Must be a positive number.'),
    duration: z.number().positive('Duration must be a positive number.'),
    // We validate the combined date in the submit handler
}).refine(() => {
    // Combine date and time for validation
    const combinedDate = liveDate.value.toDate(getLocalTimeZone());
    combinedDate.setHours(liveTime.hours, liveTime.minutes, 0, 0);
    return combinedDate.getMilliseconds() > new Date().getMilliseconds();
}, {
    message: "Scheduled date must be in the future.",
    path: ["scheduled_date"], // This will show the error on the date field
});

const tagOptions = computed(() => tags.value.map(tag => ({ label: tag.name, value: tag.id })));

function handleSelectType(type: CourseType) {
    courseState.type = type;
    // Automatically move to the next step after selection
    if (currentStep.value === 0) {
        currentStep.value = 1
    }
}

function handleFinishCreation() {
    if (currentCourse.value?.slug) {
        toast.add({ title: 'Course creation complete!', color: 'success', icon: 'i-heroicons-party-popper' });
        navigateTo(`/catalog/course/${currentCourse.value.slug}`);
    } else {
        toast.add({ title: 'Could not find course to navigate to.', color: 'error' });
    }
}

async function handleSaveLiveSession() {
    if (!currentCourse.value) return;

    // 1. Combine date and time into a single Date object for saving
    const combinedDate = liveDate.value.toDate(getLocalTimeZone());
    combinedDate.setHours(liveTime.hours, liveTime.minutes, 0, 0);
    courseState.scheduled_date = combinedDate;

    // 2. Persist the data using the updateCourse function
    // const result = await updateCourse(currentCourse.value.id, {
    //     scheduled_date: courseState.scheduled_date,
    //     max_participants: courseState.max_participants,
    //     duration: courseState.duration,
    // });

    handleFinishCreation();
    // 3. If successful, finish the process
    // if (result) {
    //     handleFinishCreation();
    // } else {
    //     toast.add({ title: 'Failed to save live session details.', color: 'red' });
    // }
}

function removeTag(e: any, itemLabel: string) {
    e.preventDefault();
    e.stopPropagation();
    courseState.tags = courseState.tags.filter((t) => t.label !== itemLabel)
}

async function handleCreateCourse() {
    const result = await createCourse({
        title: courseState.title,
        description: courseState.description,
        tags: courseState.tags.map((t) => t.value),
        type: courseState.type as string,
        school: user.value!.school.id
    });
    if (result) {
        workspaceState.name = result.slug;
        toast.add({ title: 'Step 1 Complete: Course created!', color: 'success' });
        if (courseState.type === 'cursus') {
            await fetchUserCoursesList('single');
        }
        currentStep.value = 2
    } else {
        toast.add({ title: 'Error creating course.', color: 'error' });
    }
}

const userCourseOptions = computed(() => {
    const addedCourseIds = new Set(
        cursusItems.value.map((item: any) => {
            return item.course
        })
    );

    return userCoursesList.value
        .filter(course => {
            const isNotSelf = course.id !== currentCourse.value?.id;
            const isNotAlreadyAdded = !addedCourseIds.has(course.id);
            return isNotSelf && isNotAlreadyAdded;
        })
        .map(course => ({ label: course.title, id: course.id }));
});

async function handleAddItemToCursus() {
    if (!selectedCourseToAdd.value) return;

    const result = await addCourseToCursus(selectedCourseToAdd.value!);

    if (result) {
        toast.add({ title: 'Course added to cursus.', color: 'success' });
    } else {
        toast.add({ title: 'Failed to add course.', color: 'error' });
    }
    selectedCourseToAdd.value = ''; // Reset select menu
}

async function handleRemoveItemFromCursus(itemId: string) {
    const success = await removeCourseFromCursus(itemId);

    if (success) {
        toast.add({ title: 'Course removed from cursus.', color: 'success' });
    } else {
        toast.add({ title: 'Failed to remove course.', color: 'error' });
    }
}

const workspaceSchema = z.object({
    name: z.string(),
    language: z.string({ required_error: 'Primary language is required' }),
});
const workspaceState = reactive({ name: '', language: '' });

async function handleCreateWorkspace() {
    workspacePending.value = true;
    if (currentCourse.value) {
        const result = await createWorkspace({ course: currentCourse.value.id, name: workspaceState.name, language: workspaceState.language });
        if (result) {
            createdWorkspace.value = result;
            toast.add({ title: 'Step 2 Complete: Workspace configured!', color: 'success' });
            currentStep.value = 3;
        } else {
            toast.add({ title: 'Error creating workspace.', color: 'error' });
        }
    }
    workspacePending.value = false;
}

async function handleStartWorkspace(id?: string) {
    if (!createdWorkspace.value && !id) return;
    const result = await startWorkspace(id ?? createdWorkspace.value!.id);
    if (result?.url) {
        toast.add({ title: 'Workspace is ready!', description: `Redirecting...`, color: 'success' });
        const slug = currentCourse.value ? currentCourse.value!.slug : 'introduction-to-go-j387sx'
        await navigateTo(localePath(`/teach/${slug}`));
        console.log(`Redirecting to ...`);
    } else {
        toast.add({ title: 'Error starting workspace.', description: 'Please check the logs and try again.', color: 'error' });
    }
}
</script>