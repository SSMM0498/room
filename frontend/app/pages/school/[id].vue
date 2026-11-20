<template>

  <Head>
    <Title>{{ currentSchool?.name ?? 'Loading' }}</Title>
  </Head>
  <widget-pinned-section>
    <panel-school />
  </widget-pinned-section>
  <div v-if="pending && !currentSchool" class="p-6">Loading courses...</div>
  <div v-else-if="errorMessage" class="p-6 text-red-500">{{ errorMessage }}</div>
  <div v-else-if="sectionUI.sections.length === 0" class="p-6 text-gray-500 dark:text-gray-400">
    This school has not published any course yet.
  </div>
  <layout-section v-else v-for="section in sectionUI.visibleSections" :key="section.title" :section="section" />
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'content',
  name: 'school'
});

const route = useRoute();
const { currentSchool, schoolCourses, pending, errorMessage, fetchSchool } = useSchools();

const schoolId = computed(() => route.params.id as string);

const sectionUI = useSectionUIStore();
sectionUI.sectionType = 'tech';

await useAsyncData(
  () => `school-${schoolId.value}`,
  async () => await fetchSchool(schoolId.value),
  { watch: [schoolId] }
);

watch(schoolCourses, (courses) => {
  sectionUI.sections = groupCoursesByTag(courses);
}, { immediate: true });
</script>
