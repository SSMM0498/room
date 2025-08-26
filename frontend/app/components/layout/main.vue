<template>
  <main
    class="bg-base m-0 p-0 overflow-hidden flex flex-row justify-center items-start"
    :style="{
      '--content-size': sectionUI.contentSize.toString()
    }"
  >
    <slot></slot>
  </main>
</template>

<script setup lang="ts">
const sectionUI = useSectionUIStore();
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
