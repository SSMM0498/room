<script setup lang="ts">
import type { CourseCard } from '~~/types/ui';

const localePath = useLocalePath();
const authUser = useAuthUser();

const { inProgressCourses, pending, fetchInProgressCourses } = useProgress();

onMounted(async () => {
  if (authUser.value) {
    await fetchInProgressCourses();
  }
});

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
};

const displayedCourses = computed<CourseCard[]>(() => {
  if (!inProgressCourses.value) return [];

  return inProgressCourses.value.slice(0, 2).map(course => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    section: 'Continue Learning',
    tags: course.tags || [],
    createdDate: '',
    durationFormatted: formatDuration(course.duration),
    duration: course.duration,
    progress: course.progress,
  }));
});
</script>

<template>
  <div class="flex flex-col w-full h-full items-start justify-start p-4 gap-4">
    <header class="flex flex-col justify-start items-start">
      <h1 class="text-3xl font-bold">{{ $t("quick_start.title") }}</h1>
    </header>

    <section v-if="authUser" class="flex flex-col gap-4 w-full h-full items-start justify-start">
      <h1 class="text-2xl font-bold"># {{ $t("quick_start.keep_learning") }}</h1>
      <div v-if="pending" class="text-gray-500 dark:text-gray-400">
        {{ $t("quick_start.loading") }}
      </div>
      <div v-else-if="displayedCourses.length > 0">
        <widget-row-card
          v-for="course in displayedCourses"
          :key="course.id"
          :course="course"
        />
      </div>
      <div v-else class="text-sm text-gray-500 dark:text-gray-400">
        {{ $t("quick_start.no_courses") }}
      </div>
    </section>

    <section class="flex flex-col w-full gap-2">
      <h1 class="text-2xl font-bold"># {{ $t("quick_start.action_shortcuts") }}</h1>
      <section class="flex w-full gap-2 items-start justify-start">
        <nuxt-link
          class="text-lg font-semibold flex items-center justify-center w-full hover:underline p-2 border-1 border-gray-200 dark:border-gray-800 bg-primary-600 text-white rounded-lg"
          :to="localePath('/catalog')">
          <UIcon name="i-heroicons-academic-cap-20-solid" class="mr-2"/>{{ $t("quick_start.join_school") }}
        </nuxt-link>
        <nuxt-link
          class="text-lg font-semibold flex items-center justify-center w-full hover:underline p-2 border-1 border-gray-200 dark:border-gray-800 bg-primary-600 text-white rounded-lg"
          :to="localePath('/catalog')">
          <UIcon name="i-heroicons-magnifying-glass-20-solid" class="mr-2" />{{ $t("quick_start.find_room") }}
        </nuxt-link>
      </section>
      <section class="flex w-full gap-2 items-start justify-start">
        <nuxt-link
          class="text-lg font-semibold flex items-center justify-center w-full hover:underline p-2 border-1 border-gray-200 dark:border-gray-800 bg-primary-600 text-white rounded-lg"
          :to="localePath('/teach/new')">
          <UIcon name="i-heroicons-squares-2x2-20-solid" class="mr-2" />{{ $t("quick_start.start_room") }}
        </nuxt-link>
        <nuxt-link
          class="text-lg font-semibold flex items-center justify-center w-full hover:underline p-2 border-1 border-gray-200 dark:border-gray-800 bg-primary-600 text-white rounded-lg">
          <!-- :to="localePath('/create/school')"> -->
          <UIcon name="i-heroicons-plus-circle-20-solid" class="mr-2" />{{ $t("quick_start.create_school") }}
        </nuxt-link>
      </section>
    </section>
  </div>
</template>
