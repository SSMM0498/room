<script setup lang="ts">
import type { CourseCard, Section } from '../../types/ui';
import { type RecordModel } from 'pocketbase';

const { t } = useI18n();

definePageMeta({
  alias: ["/"],
  layout: "content",
});

useHead({
  title: t('home'),
})

interface HomeFeedData {
  tags: RecordModel[];
  courses: RecordModel[];
}

/**
 * Parses a raw PocketBase course record into a clean CourseCard object
 * suitable for use in frontend components.
 *
 * @param record - The raw RecordModel object from a PocketBase fetch request.
 * @returns A formatted CourseCard object.
 */
const parseCourseRecordToCard = (record: RecordModel): CourseCard => {
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
    description: record.description,
    type: record.type,
    createdDate,
    section: '',
    durationFormatted,
    tags,
    author: record.expand?.author, // Embed the expanded author record
    price: record.price,
  };
};

const { data, pending, error } = await useAsyncData<HomeFeedData>(
  'home-feed',
  () => $fetch('/api/home-feed')
);

const sections = computed(() => {
  if (!data.value) return [];

  const { tags, courses: rawCourses } = data.value;
  const sectionsArray = [];

  const parsedCourses = rawCourses.map(parseCourseRecordToCard);

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

  for (const tag of tags) {
    const coursesForTag = parsedCourses.filter(course => 
      course.tags.some(t => t.id === tag.id)
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
  <div v-if="pending" class="p-6">Loading sections...</div>
  <div v-else-if="error" class="p-6 text-red-500">Failed to load courses. Please try again.</div>
  <layout-section :section="section" v-for="section in sections" :key="section.title"></layout-section>
</template>
