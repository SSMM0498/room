<template>
  <layout-ide-header :is-player="isPlayer" />
  <main class="bg-base m-0 p-0 overflow-hidden">
    <slot />
  </main>
  <layout-ide-footer />
</template>

<script setup lang="ts">
const route = useRoute();
const isPlayer = computed(() => (route.name as string).startsWith('ide/player'));
</script>

<style scoped lang="css">
@reference "tailwindcss";

main {
  @apply mt-[40px];
  height: calc(100vh - 65px);
}
</style>
