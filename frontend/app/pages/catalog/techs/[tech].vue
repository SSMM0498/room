<script setup lang="ts">
import type { RecordModel } from 'pocketbase';

const route = useRoute();
const tech = (route.params.tech as string);
const sectionUI = useSectionUIStore();
sectionUI.sectionType = 'profile'

definePageMeta({
  alias: ["/catalog/techs/:tech()"],
  layout: "content",
});

useHead({
  title: tech.charAt(0).toUpperCase() + tech.slice(1),
});

const { courses, fetchCoursesByTag, pending, error } = useCourses();

const tagData = ref<RecordModel | null>(null);

await useAsyncData(`tech-${tech}`, async () => {
  const response = await fetchCoursesByTag(tech.toLowerCase());
  if (response) {
    tagData.value = response.tag;
  }
  return courses.value;
});

watch(courses, () => {
  if (!courses.value || courses.value.length === 0) {
    return [];
  }

  // Create a map of author ID to courses
  const authorMap = new Map<string, any>();

  courses.value.forEach(course => {
    const author = course.author;
    if (!author) return;

    const authorId = author.id;
    if (!authorMap.has(authorId)) {
      authorMap.set(authorId, {
        author,
        courses: []
      });
    }
    authorMap.get(authorId)!.courses.push(course);
  });

  // Convert map to sections array
  sectionUI.sections = Array.from(authorMap.values()).map(({ author, courses }) => ({
    title: author.username || author.name || 'Unknown',
    courses: courses.map((c: any) => ({ ...c, section: author.username || author.name }))
  }));
}, { immediate: true })
</script>

<template>
  <widget-pinned-section>
    <panel-tech :tech="tech.toLowerCase()" :tag-data="tagData" />
  </widget-pinned-section>

  <div v-if="pending" class="p-6">Loading courses...</div>
  <div v-else-if="error" class="p-6 text-red-500">Failed to load courses for {{ tech }}.</div>
  <div v-else-if="sectionUI.sections.length === 0" class="p-6 text-gray-500">No courses found for {{ tech }}.</div>

  <layout-section v-for="section in sectionUI.sections" :key="section.title" :section="section" />
</template>
