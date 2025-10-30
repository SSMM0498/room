<script setup lang="ts">
import type { Section } from '~~/types/ui';

const { t } = useI18n();
const user = useAuthUser();

definePageMeta({
  alias: ["/catalog"],
  layout: "content",
});

useHead({
  title: t('catalog'),
})

const { courses, fetchCourses, pending: isPending, error: hasError } = useCourses();
const { tags } = useTags();

await useAsyncData('home-page-data', async () => await fetchCourses());

const sectionUI = useSectionUIStore();
sectionUI.sectionType = 'tech'

watch([courses, tags], () => {
  if (!courses.value || !tags.value) {
    sectionUI.sections = []
    return
  }

  const parsedCourses = courses.value
  const sectionsArray: Section[] = []

  sectionsArray.push({
    title: 'Latest',
    courses: parsedCourses.slice(0, Math.min(parsedCourses.length, 5)).map(c => ({ ...c, section: 'Latest' })),
  })

  if (parsedCourses.length > 5) {
    sectionsArray.push({
      title: 'Top',
      courses: parsedCourses.slice(5, 10).map(c => ({ ...c, section: 'Top' })),
    })
  }

  for (const tag of tags.value) {
    const coursesForTag = parsedCourses.filter(course =>
      course.tags.some((t: any) => t.id === tag.id)
    )
    if (coursesForTag.length > 0) {
      sectionsArray.push({
        title: tag.name,
        courses: coursesForTag.map(c => ({ ...c, section: tag.name })),
      })
    }
  }

  sectionUI.sections = sectionsArray
}, { immediate: true })
</script>

<template>
  <widget-pinned-section v-if="user">
    <panel-quick-start />
  </widget-pinned-section>
  <div v-if="isPending" class="p-6">Loading sections...</div>
  <div v-else-if="hasError" class="p-6 text-red-500">Failed to load courses. Please try again.</div>
  <layout-section :section="section" v-for="section in sectionUI.sections" :key="section.title"></layout-section>
</template>