<template>
  <footer class="fixed bottom-0 left-0 z-20 w-full flex items-center justify-between border-t ui-base p-1 text-xs border-gray-200 dark:border-gray-800">
    <nav class="flex flex-wrap items-center gap-3">
      <!-- Connection Status -->
      <div class="flex items-center gap-1.5">
        <div :class="[
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-green-500' : 'bg-gray-400'
        ]"></div>
        <span>{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
      </div>

      <!-- Mode Indicator -->
      <span class="text-gray-500 dark:text-gray-500">{{ mode }}</span>

      <!-- File Info (placeholder for now) -->
      <span class="mr-3">697 bytes</span>
      <span class="mr-3">Spaces: 2</span>
      <span class="mr-3">vue</span>
      <span>Ln 5, Col 17</span>
    </nav>
  </footer>
</template>

<script setup lang="ts">
const route = useRoute();
const { socketClient } = useSocket();

const isConnected = computed(() => socketClient?.isConnected ?? false);

const mode = computed(() => {
  const routeName = route.name as string;
  if (routeName?.startsWith('teach-page')) {
    return 'Recorder';
  } else if (routeName?.includes('learn')) {
    return 'Player';
  }
  return 'IDE';
});
</script>

<style scoped lang="css">
@reference "tailwindcss";

footer {
  @apply h-[25px]
}
</style>
