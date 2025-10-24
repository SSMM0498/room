<template>
  <section
    :class="{ 'w-[80vw] pr-5 !gap-0 pt-0': uiStore.articleOpened && uiStore.currentSection === section.title, 'overlay border-gray-700': uiStore.articleOpened && uiStore.currentSection !== section.title }"
    :id="section.title.toLowerCase()"
    class="scroll-col w-[27.5vw] gap-5 relative flex items-start content-start flex-col px-4 pt-2 pb-8 border-gray-200 dark:border-gray-800 border-r overflow-x-hidden overflow-y-scroll">
    <div :class="{ '!hidden': uiStore.articleOpened && uiStore.currentSection === section.title, }"
      class="flex w-[110%] justify-between items-center sticky z-50 bg-white dark:bg-gray-900 py-3 -ml-3 px-3 -top-2">
      <h1 class="flex font-semibold text-3xl">{{ section.title }}
      </h1>
      <UButton variant="link" :to="`/catalog/techs/${section.title.toLowerCase()}`">{{ $t('all') }}</UButton>
    </div>
    <widget-card v-for="course in section.courses" :key="course.id" :course="course" />
  </section>
</template>
<script lang="ts" setup>
import type { Section } from '../../../types/ui';

defineProps<{
  section: Section;
}>();

const uiStore = useSectionUIStore();
</script>
<style scoped lang="css">
@reference "tailwindcss";

section {
  position: relative;
  min-height: calc(100vh - 85px);
  max-height: calc(100vh - 85px);
  transition: all 0.5s ease-in-out;
}

section.highlight::after {
  content: '';
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  background: #3b82f6;
  transition: .5s;
  z-index: 50;
  animation: blinking .25s ease-in-out infinite alternate;
}

@keyframes blinking {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 0.25;
  }

  100% {
    opacity: 0;
  }
}

section article:nth-child(2) {
  @apply !mt-0;
}

section::after {
  display: block;
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: -9px;
  bottom: 0;
  height: 100%;
  pointer-events: none;
  transition: opacity 1s;
  @apply bg-black/85 opacity-0 z-50;
}

section.overlay {
  overflow: hidden;
  -webkit-mask-position: left top;
  mask-position: left top;
}

section.overlay::after {
  transition: opacity .5s;
  @apply opacity-100;
}

section.overlay:hover:after {
  @apply opacity-0;
}

section.overlay:hover {
  overflow-y: scroll;
}

section h1::before {
  display: block;
  content: "#";
  font-weight: bold;
  @apply text-blue-600;
}
</style>
