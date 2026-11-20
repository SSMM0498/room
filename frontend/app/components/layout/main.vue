<template>
  <main
    class="bg-base m-0 p-0 overflow-hidden flex flex-row justify-center items-start w-full"
    :style="{
      '--content-size': sectionUI.contentSize.toString()
    }"
  >
    <slot></slot>
    <!-- Listing pages render their sections into the slot above; when the header
         filters leave none of them standing, the page would otherwise go blank. -->
    <div v-if="sectionUI.filteredOutEverything" class="p-6 flex flex-col items-start gap-3 text-gray-500 dark:text-gray-400">
      <p>{{ $t('filters.no_results') }}</p>
      <UButton size="xs" variant="soft" color="neutral" icon="i-heroicons-arrow-path-20-solid" @click="resetFilters">
        {{ $t('filters.reset') }}
      </UButton>
    </div>
  </main>
</template>

<script setup lang="ts">
const sectionUI = useSectionUIStore();
const { resetFilters } = useCourseFilters();
sectionUI.resetUI();
</script>

<style scoped>
main {
  @apply mt-[60px] w-full;
  width: 100vw;
  height: calc(100vh - 85px);
}

main.content-list {
  width: calc(100% * var(--content-size));
  @apply justify-stretch;
}
</style>
