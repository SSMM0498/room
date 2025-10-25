<template>
  <div id="ide-wrapper" class="flex w-full h-full px-2 pb-2">
    <aside flex items-center justify-center mr-2 class="w-1/7 max-w-1/7" h-full>
      <USkeleton v-if="loading" class="w-full h-full" />
      <widget-file-explorer v-else class="panel py-2 px-3" border border-gray-200 dark:border-gray-800 rounded-lg
        bg-gray-100 dark:bg-gray-800 dark:border-gray-700 />
    </aside>
    <div flex flex-col items-center justify-center h-full mr-2 class="w-3/7" overflow-hidden>
      <USkeleton v-if="loading" class="w-full h-full" />
      <widget-editor v-else w-full border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100 dark:bg-gray-800
        dark:border-gray-700 h-full />
    </div>
    <div flex flex-col items-center justify-center h-full mr-2 class="w-3/7">
      <USkeleton v-if="loading" class="w-full h-full" />
      <template v-else>
        <widget-browser :key="url" :defaultUrl="url" :class="`panel ${showTerminal ? 'h-1/2 mb-2' : 'h-full'}`" w />
        <widget-terminal-wrapper v-show="showTerminal" class="h-3/7" border border-gray-200 dark:border-gray-800
          rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-700 />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import objectPath from 'object-path'
import type { WatchResponse, RenameData } from '~~/types/file-tree';

const loading = ref(true);
const { socketClient } = useSocket();

definePageMeta({
  alias: ["/ide"],
  layout: "ide",
});

useHead({
  title: "IDE",
})

const {
  url,
  showTerminal,
  directoryTree,
  activeTab,
  openFolders,
  handleFileDelete,
  handleDirectoryDelete,
  handleRename,
} = useIDE();

onMounted(() => {
  socketClient.connect(() => loading.value = false);
})

socketClient.handleWatch(({ event, data }: WatchResponse) => {
  if (event === "rename") {
    const { oldPath, newPath } = data as RenameData;
    if (oldPath && newPath) {
      const deletedPath = getObjectPath(oldPath);
      objectPath.del(directoryTree, deletedPath);
      handleRename(oldPath, newPath);
    }
  } else if (event === "unlink" || event === "unlinkDir") {
    const deletedPath = getObjectPath(data as string);
    objectPath.del(directoryTree, deletedPath);
    if (event === "unlink") {
      handleFileDelete(data as string);
    } else if (event === "unlinkDir") {
      handleDirectoryDelete(data as string);
    }
  } else if (event === "add" || event === "addDir") {
    const parentFolder = (data as string).split("/").slice(1, -1).join("/");
    const isOpenFolder = openFolders.value.some(folder => (data as string).startsWith(folder));
    if (isOpenFolder || (event === "addDir" && openFolders.value.includes(data as string))) {
      socketClient.readFolder({
        targetPath: "/" + parentFolder,
      });
    }
  } else if (event === "change") {
    if (activeTab && activeTab.filePath === data as string) {
      socketClient.readFile({
        targetPath: data as string,
      });
    }
  }
});
</script>

<style lang="css" scoped>
@reference "tailwindcss";

.panel {
  @apply flex flex-col text-left overflow-hidden grow w-full h-full rounded-lg;
}
</style>