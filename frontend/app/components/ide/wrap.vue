<template>
  <aside class="flex items-center justify-center mx-2 pb-2 w-1/7 max-w-1/7 h-full">
    <USkeleton v-if="loading" class="w-full h-full" />
    <ide-file-explorer v-else class="panel py-2 border border-gray-300 rounded-lg bg-gray-100
      dark:bg-gray-800 dark:border-gray-700" />
  </aside>
  <div class="flex flex-col items-center justify-center h-full mr-2 pb-2 w-3/7 overflow-hidden">
    <USkeleton v-if="loading" class="w-full h-full" />
    <ide-editor v-else @editor-mounted="handleEditorMounted" class="w-full border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-700
      h-full" />
  </div>
  <div class="w-3/7 flex flex-col items-center justify-center h-full mr-2 pb-2">
    <USkeleton v-if="loading" class="w-full h-1/2 mb-2" />
    <USkeleton v-if="loading" class="w-full h-1/2" />
    <template v-else>
      <ide-browser :key="url" :defaultUrl="url" class="border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800" :class="`panel ${showTerminal ? 'h-1/2 mb-2' : 'h-full'}`" w />
      <ide-terminal-wrapper v-show="showTerminal" class="h-3/7 border border-gray-300 rounded-lg bg-gray-100
        dark:bg-gray-800 dark:border-gray-700" />
    </template>
  </div>
</template>

<script setup lang="ts">
import type * as monaco from 'monaco-editor';

const {
  url,
  showTerminal,
} = useIDE();

// Accept loading state from parent
const props = defineProps<{
  loading?: boolean;
}>();

// Use loading from props or default to true
const loading = computed(() => props.loading ?? true);

// Define emits to forward editor events to parent
const emit = defineEmits<{
  editorMounted: [editor: monaco.editor.IStandaloneCodeEditor]
}>();

// Forward editor mounted event to parent
const handleEditorMounted = (editor: monaco.editor.IStandaloneCodeEditor) => {
  emit('editorMounted', editor);
};
</script>

<style lang="css" scoped>
@reference "tailwindcss";

.panel {
  @apply flex flex-col text-left overflow-hidden grow w-full h-full rounded-lg;
}
</style>