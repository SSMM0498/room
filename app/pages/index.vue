<script setup lang="ts">
import type { Section } from '~~/types/ui';

const { t } = useI18n();

definePageMeta({
  alias: ["/"],
  layout: "content",
});

useHead({
  title: t('home'),
})

const { courses, fetchCourses, pending: coursesPending, error: coursesError } = useCourses();
const { tags, fetchTags, pending: tagsPending, error: tagsError } = useTags();

await useAsyncData('home-page-data', () => Promise.all([
  fetchCourses(),
  fetchTags()
]));

const isPending = computed(() => coursesPending.value || tagsPending.value);
const hasError = computed(() => coursesError.value || tagsError.value);

const sections = computed<Section[]>(() => {
  if (!courses.value || !tags.value) return [];

  const sectionsArray: Section[] = [];
  const parsedCourses = courses.value;

  sectionsArray.push({
    title: 'Latest',
    courses: parsedCourses.slice(0, Math.min(parsedCourses.length, 5)).map((c) => ({...c, section: 'Latest'})), // Get the 5 newest courses
  });

  if (parsedCourses.length > 5) {
    sectionsArray.push({
      title: 'Top',
      courses: parsedCourses.slice(5, 10).map((c) => ({...c, section: 'Top'})),
    });
  }

  for (const tag of tags.value) {
    const coursesForTag = parsedCourses.filter(course => 
      course.tags.some((t: any) => t.id === tag.id)
    );

    if (coursesForTag.length > 0) {
      sectionsArray.push({
        title: tag.name,
        courses: coursesForTag.map((c) => ({...c, section: tag.name})),
      });
    }
  }

  return sectionsArray;
});
</script>

<template>
  <widget-pinned-section>
    <panel-quick-start />
  </widget-pinned-section>
  <div v-if="isPending" class="p-6">Loading sections...</div>
  <div v-else-if="hasError" class="p-6 text-red-500">Failed to load courses. Please try again.</div>
  <layout-section :section="section" v-for="section in sections" :key="section.title"></layout-section>
</template>
