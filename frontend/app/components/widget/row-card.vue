<template>
  <article
    :class="{ 'cursus pr-3': course.type === 'cursus', 'live': course.type === 'live', 'live run': course.type === 'live run' }"
    :id="`${course.section.toLowerCase()}-${course.id}`"
    :style="{ '--random-right': `${randomRight}%`, '--random-top': `${randomTop}%` }"
    class="p-2 border border-gray-300 rounded-lg">
    <NuxtLink class="cursor-pointer text-xl mb-2 font-medium" :to="`/catalog/course/${course.slug}`">
      {{ course.id }} . {{ course.title }}
    </NuxtLink>
    <div class="tags">
      <widget-tag v-for="tag in course.tags" :key="tag.id" :link="`#${tag.name}`">{{ tag.name }}</widget-tag>
    </div>
    <p class="text-sm text-semibold">
      {{ course.description }}
    </p>
  </article>
</template>
<script setup lang="ts">
import type { CourseCard } from '../../../types/ui';

defineProps<{
  course: CourseCard;
}>();

const uiStore = useSectionUIStore();
const expandAllSection = ref(false);

const randomRight = computed(() => 25 + Math.floor(Math.random() * 51)); // Random number between 50 and 100
const randomTop = computed(() => Math.floor(Math.random() * 50)); // Random number between 0 and 100
</script>

<style scoped>
article {
  position: relative;
  overflow: hidden;
}

article p {
  z-index: 50;
}

article::after {
  content: '';
  position: absolute;
  left: var(--random-right);
  top: var(--random-top);
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background-color: rgb(147, 197, 253);
  /* ring-blue-300 equivalent */
  opacity: 0.5;
  pointer-events: none;
}
</style>