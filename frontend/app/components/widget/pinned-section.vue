<script setup lang="ts">
const hideSection = ref(false);
</script>

<template>
  <div :class="{ '!w-[20px] !p-0': hideSection }"
    class="pinned-section w-[600px] max-w-[500px] h-full border-r transition-all duration-100 border-gray-200 dark:border-gray-800">
    <div v-show="!hideSection" class="flex items-start justify-start flex-col w-full h-full">
      <slot v-if="!hideSection"></slot>
    </div>
    <UButton square size="xs"
      :icon="hideSection ? 'i-heroicons-chevron-right-16-solid' : 'i-heroicons-chevron-left-16-solid'"
      @click="(_) => { hideSection = !hideSection }" class="absolute -right-3 top-1/2 z-90"></UButton>
  </div>
</template>

<style scoped>
.pinned-section {
  position: relative;
  min-height: calc(100vh - 85px);
  max-height: calc(100vh - 85px);
}
</style>
