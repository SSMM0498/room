<template>
  <footer
    class="fixed bottom-0 left-0 z-20 w-full flex items-center justify-between border-t ui-base p-1 px-5 text-xs border-gray-200 dark:border-gray-800">
    <nav class="flex flex-wrap items-center justify-between w-full">
      <!-- File Info -->
      <div class="flex items-center justify-start space-x-3" v-if="activeTab.filePath">
        <span>{{ fileSize }}</span>
        <span>Spaces: {{ tabSize }}</span>
        <span>{{ fileExtension }}</span>
        <span>Ln {{ cursorPosition.line }}, Col {{ cursorPosition.col }}</span>
      </div>
      <div v-else class="flex"></div>
      <div class="flex items-center justify-start space-x-3">
        <!-- Mode Indicator -->
        <span class="text-muted">{{ mode }}</span>
        <!-- Connection Status -->
        <div class="flex items-center space-x-1">
          <span class="relative flex w-2 h-2">
            <span v-if="isSocketConnected" class="absolute w-2 h-2 rounded-full animate-ping bg-green-500 opacity-75"></span>
            <span :class="[
              'absolute w-2 h-2 rounded-full',
              isSocketConnected ? 'bg-green-500' : 'bg-error'
            ]"></span>
          </span>
          <span>{{ isSocketConnected ? 'Connected' : 'Disconnected' }}</span>
        </div>
      </div>
    </nav>
  </footer>
</template>

<script setup lang="ts">
const route = useRoute();
const {
  isSocketConnected,
  activeTab,
  cursorPosition
} = useIDE();

const mode = computed(() => {
  const routeName = route.name as string;
  if (routeName?.startsWith('teach-page')) {
    return 'Recorder';
  } else if (routeName?.includes('learn')) {
    return 'Player';
  }
  return 'IDE';
});

// Calculate file size in bytes
const fileSize = computed(() => {
  if (!activeTab.fileContent) return '0 bytes';
  const bytes = new Blob([activeTab.fileContent]).size;
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
});

// Detect tab size from file content (default to 2)
const tabSize = computed(() => {
  if (!activeTab.fileContent) return 2;

  // Try to detect indentation from first indented line
  const lines = activeTab.fileContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\s+)/);
    if (match && match[1]) {
      const spaces = match[1];
      // Count spaces (ignore tabs for now)
      if (spaces.startsWith('  ')) {
        return spaces.length;
      }
    }
  }
  return 2; // Default
});

// Get file extension
const fileExtension = computed(() => {
  if (!activeTab.filePath) return '';
  const parts = activeTab.filePath.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  return 'plaintext';
});
</script>

<style scoped lang="css">
@reference "tailwindcss";

footer {
  @apply h-[25px]
}
</style>
