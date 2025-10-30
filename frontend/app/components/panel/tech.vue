<script setup lang="ts">
import type { RecordModel } from 'pocketbase';

defineProps<{
  tech: string;
  tagData?: RecordModel | null;
}>();
</script>

<template>
  <section class="flex flex-col gap-4 overflow-y-scroll p-4">
    <div class="prose dark:prose-invert max-w-none">
      {{ tagData?.presentation }}
      <MDC :value="tagData?.presentation" />
    </div>
  </section>
</template>

<style scoped lang="css">
@reference "tailwindcss";

section {
  position: relative;
  min-height: calc(100vh - 85px);
  max-height: calc(100vh - 85px);
  transition: all 0.5s ease-in-out;
}

.prose :where(h1) {
  margin-top: 0 !important;
  color: transparent;
  background: conic-gradient(#003865ff 12%,
      #7213fdff 12%, #7213fdff 33%,
      #13a0fdff 33%, #13a0fdff 55%,
      #3ccf4eff 55%, #3ccf4eff 70%,
      #ef5b0cff 70%, #ef5b0cff 87%,
      #003865ff 87%);
  background-size: 25%;
  background-clip: text;
  -webkit-background-clip: text;
  cursor: pointer;
  font-size: 4rem;
  font-weight: 600;
  @apply relative flex w-full items-center justify-start px-2 z-20;
}

html.dark .prose :where(h1) {
  background: conic-gradient(#ffffff 12%,
      #7213fdff 12%, #7213fdff 33%,
      #13a0fdff 33%, #13a0fdff 55%,
      #3ccf4eff 55%, #3ccf4eff 70%,
      #ef5b0cff 70%, #ef5b0cff 87%,
      #ffffff 87%);
  background-size: 25%;
  background-clip: text;
  -webkit-background-clip: text;
  cursor: pointer;
  font-size: 4rem;
  font-weight: 600;
}

.prose :where(h1)::before {
  display: block;
  content: "#";
  font-size: 4rem;
  font-weight: bold;
  @apply text-blue-900;
}

.prose :where(h1):hover {
  animation: expand 0.5s ease forwards;
}

.prose :where(h2) {
  margin-top: .5rem !important;
}

.prose :where(p) {
  margin: 0 0 .5rem !important;
  line-height: 1.5;
}

.prose :where(li) {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

@keyframes expand {
  0% {
    background-size: 25%;
    background-position: 0 0;
  }

  20% {
    background-size: 55%;
    background-position: 0 1em;
  }

  100% {
    background-size: 325%;
    background-position: -10em -4em;
  }
}

@keyframes expand-rev {
  0% {
    background-size: 325%;
    background-position: -10em -4em;
  }

  20% {
    background-size: 55%;
    background-position: 0 1em;
  }

  100% {
    background-size: 25%;
    background-position: 0 0;
  }
}
</style>