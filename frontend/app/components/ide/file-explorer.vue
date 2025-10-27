<template>
  <div class="relative w-full flex flex-col">
    <div class="flex flex-col w-full">
      <div class="flex w-full items-center justify-between mb-2">
        <div class="flex w-full items-center justify-start gap-1">
          <UIcon name="i-ci:folders" class="size-4 mr-1" />
          <h5>Explorer</h5>
        </div>
        <div class="flex items-center gap-1">
          <UButton id="btn-create-file" variant="subtle" square size="xs" color="neutral"
            @click.prevent="handleCreateFile" icon="i-tdesign:file-add" class="cursor-pointer">
          </UButton>
          <UButton id="btn-create-folder" variant="subtle" square size="xs" color="neutral"
            @click.prevent="handleCreateFolder" icon="i-tdesign-folder-add" class="cursor-pointer">
          </UButton>
          <UPopover>
            <UButton id="btn-more-file" variant="subtle" square size="xs" color="neutral" icon="i-tdesign-more"
              :loading="isUploading">
            </UButton>
            <template #content>
              <div class="flex flex-col p-2 gap-2">
                <UButton id="btn-upload-file" variant="ghost" square size="sm" color="primary"
                  @click.prevent="handleUpload" icon="i-tdesign-upload" label="upload" :loading="isUploading">
                </UButton>
                <UButton id="btn-download-file" variant="ghost" square size="sm" color="primary"
                  @click.prevent="handleDownload" icon="i-tdesign-download" label="download" :loading="isDownloading">
                </UButton>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
      <UInput id="input-create-resource" variant="subtle" v-if="resourceCreation.isCreating && (activeResources.length === 0 || activeResources[0]!!.path === '/workspace')
      " type="text" v-model="resourceCreation.name" autofocus
        @blur.prevent="(event: FocusEvent) => resourceCreation.isCreating = false"
        @keyup.prevent.escape="(event: KeyboardEvent) => resourceCreation.isCreating = false"
        @keyup.prevent.enter="handleCreateSubmit" />
    </div>
    <USeparator class="w-full" :ui="{ border: 'border-accented' }" />
    <div class="w-full flex flex-col h-full overflow-y-auto overflow-x-hidden">
      <Suspense>
        <ide-directory-tree v-if="directoryTree.workspace" :depth="1" :directory="directoryTree.workspace"
          @open-folder="openFolder" @open-file="openFile" @delete-resource="deleteResource"
          @move-resource="moveResource" />
      </Suspense>
      <div id="drop-zone" class="mt-4" @click.prevent="handleBackgroundClick" @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave" @drop.prevent="handleDrop" :class="{ 'drag-over': isDragging }">
      </div>
    </div>
    <input ref="fileInput" type="file" multiple class="hidden" @change="onFileSelected" />
  </div>
</template>

<script setup lang="ts">
import type { ReadFileResponse, ReadFolderResponse, DirectoryTreeType, Resource, ReadFolderEventType, ReadFileEventType, DeleteEventType, MoveEventType } from '~~/types/file-tree';
import * as objectPathImmutable from "object-path-immutable";
import objectPath from "object-path";
import { getObjectPath } from "~/utils/file-tree";

const {
  activeResources,
  resourceCreation,
  directoryTree,
  openFolders,
  clearSelection,
  addNewTab,
  setActiveTab,
  handleCreateSubmit,
  handleCreateFile,
  handleCreateFolder,
  setDirectoryTree,
  toggleOpenFolder,
  deletingResources,
  movingResources,
  deleteTab,
  openTabs,
  activeTab,
} = useIDE();

const { socketClient } = useSocket();

const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const isDownloading = ref(false);
const isDragging = ref(false);

const handleUpload = () => {
  fileInput.value?.click();
};

const uploadFiles = async (files: File[]) => {
  if (!files.length) return;

  isUploading.value = true;
  const uploadPath = activeResources[0]!.type === 'directory'
    ? activeResources[0]!.path
    : activeResources[0]!.path.substring(0, activeResources[0]!.path.lastIndexOf('/'));

  try {
    await Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          const buffer = reader.result as ArrayBuffer;
          // Convert ArrayBuffer to base64 for binary file support
          const base64 = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
          );
          socketClient.hydrateCreateFile(`${uploadPath}/${file.name}`, base64);
          resolve(null);
        };

        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }));
  } finally {
    isUploading.value = false;
  }
};

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  await uploadFiles(Array.from(input.files));
  input.value = ''; // Reset input
};

const handleDownload = async () => {
  isDownloading.value = true;
  const downloadPath = activeResources[0]!.type === 'directory'
    ? activeResources[0]!.path
    : activeResources[0]!.path.substring(0, activeResources[0]!.path.lastIndexOf('/'));

  try {
    socketClient.downloadProject(downloadPath);
  } catch (error) {
    console.error('Download failed:', error);
  }
};

socketClient.handleDownload((zipContent) => {
  console.log('Download response:', zipContent);
  try {
    const blob = new Blob([zipContent], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } finally {
    isDownloading.value = false;
  }
});

const handleDragOver = (event: DragEvent) => {
  isDragging.value = true;
  event.dataTransfer!.dropEffect = 'copy';
};

const handleDragLeave = () => {
  isDragging.value = false;
};

const handleDrop = async (event: DragEvent) => {
  isDragging.value = false;

  const files = Array.from(event.dataTransfer?.files || []);
  if (files.length > 0) {
    await uploadFiles(files);
    return;
  }

  activeResources.forEach(resource => {
    const newPath = `/workspace/${resource.name}`;
    moveResource({
      targetPath: resource.path,
      newPath: newPath
    });
  });
};

const handleBackgroundClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    clearSelection();
  }
};

onMounted(() => {
  socketClient.init(); // Initialize backend watcher event loop
  socketClient.readFolder({
    targetPath: "/workspace",
  });
});

socketClient.handleReadFile((data: ReadFileResponse) => {
  const newActiveTab = {
    filePath: data.targetPath,
    fileContent: data.fileContent,
  };
  setActiveTab(newActiveTab);
  addNewTab(newActiveTab);
});

// Reusable function to update directory tree with folder contents
const updateDirectoryTreeWithFolderContents = (data: ReadFolderResponse) => {
  const parentFoldersTillRoot = data.targetPath
    .split("/")
    .splice(1)
    .join(".content.");

  const newDirectoryTree: DirectoryTreeType = JSON.parse(
    JSON.stringify(objectPathImmutable.get(directoryTree, ""))
  );

  const currentDirectory = objectPath.get(
    newDirectoryTree,
    parentFoldersTillRoot
  ) as {
    type: "directory" | "file";
    isOpen: boolean;
    path: string;
    name: string;
    content: DirectoryTreeType;
  };

  if (currentDirectory && currentDirectory.content) {
    // Sort folders first, then files, both alphabetically
    const sortedContents = data.folderContents.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });

    // Clear existing content to ensure proper ordering
    currentDirectory.content = {};

    // Rebuild content in sorted order
    sortedContents.forEach((folderContent: Resource) => {
      const isOpen = folderContent.type === 'directory' && openFolders.value.includes(folderContent.path);
      currentDirectory.content[folderContent.name] = {
        type: folderContent.type,
        isOpen,
        path: folderContent.path,
        name: folderContent.name,
        content: {},
      };

      if (isOpen) {
        socketClient.readFolder({
          targetPath: folderContent.path
        });
      }
    });

    objectPath.set(newDirectoryTree, parentFoldersTillRoot, currentDirectory);
    setDirectoryTree(newDirectoryTree);
  }
};

socketClient.handleReadFolder(updateDirectoryTreeWithFolderContents);

// Handle file hydration confirmations - worker returns folder contents directly
socketClient.handleHydrateCreateFile((data: ReadFolderResponse) => {
  console.log(`[IDE] File hydrated, updating folder: ${data.targetPath}`);
  // Only update if folder is currently open
  if (openFolders.value.includes(data.targetPath)) {
    updateDirectoryTreeWithFolderContents(data);
  }
});

// Handle file creation - worker returns folder contents directly
socketClient.handleCreateFile((data: ReadFolderResponse) => {
  console.log(`[IDE] File created, updating folder: ${data.targetPath}`);
  // Only update if folder is currently open
  if (openFolders.value.includes(data.targetPath)) {
    updateDirectoryTreeWithFolderContents(data);
  }
});

// Handle folder creation - worker returns folder contents directly
socketClient.handleCreateFolder((data: ReadFolderResponse) => {
  console.log(`[IDE] Folder created, updating folder: ${data.targetPath}`);
  // Only update if folder is currently open
  if (openFolders.value.includes(data.targetPath)) {
    updateDirectoryTreeWithFolderContents(data);
  }
});

const openFolder = (data: ReadFolderEventType) => {
  const isCurrentlyOpen = openFolders.value.includes(data.targetPath);
  toggleOpenFolder(data.targetPath);

  if (!isCurrentlyOpen) {
    // Opening folder - read its contents
    socketClient.readFolder(data);
  } else {
    // Closing folder - notify backend to stop watching
    socketClient.collapseFolder(data.targetPath);
  }
};

const openFile = (data: ReadFileEventType) => socketClient.readFile(data);

const deleteResource = (data: DeleteEventType) => {
  deletingResources.value.add(data.targetPath);
  const deletedPath = getObjectPath(data.targetPath);
  objectPath.del(directoryTree, deletedPath);
  socketClient.deleteResource(data)
};

const moveResource = (data: MoveEventType) => {
  movingResources.value.add(data.targetPath);
  const deletedPath = getObjectPath(data.targetPath);
  objectPath.del(directoryTree, deletedPath);
  socketClient.moveResource(data)
};

// Handle move resource response from server
socketClient.handleMoveResource((data: any) => {
  console.log(`[IDE] Resource moved, refreshing parent folder`);
  movingResources.value.delete(data.oldPath);

  // Update tabs if a file or files within a directory were renamed/moved
  const tabsToUpdate = openTabs.tabs.filter(tab => {
    console.log(">>> filePath", tab.filePath)
    console.log(">>> oldPath", data.oldPath)
    return tab.filePath === data.oldPath || tab.filePath.startsWith(data.oldPath + '/')
  }
  );

  tabsToUpdate.forEach((tab) => {
    const tabIndex = openTabs.tabs.findIndex(t => t.filePath === tab.filePath);
    if (tabIndex !== -1) {
      const oldPath = tab.filePath;
      const newPath = oldPath === data.oldPath
        ? data.newPath
        : data.newPath + oldPath.slice(data.oldPath.length);

      openTabs.tabs[tabIndex]!.filePath = newPath;

      // Update active tab if it's the one being renamed
      if (activeTab.filePath === oldPath) {
        activeTab.filePath = newPath;
      }
    }
  });

  // Extract parent folder path from the new location
  const parentPath = data.newPath.substring(0, data.newPath.lastIndexOf('/'));

  // Refresh the parent folder if it's open
  if (openFolders.value.includes(parentPath)) {
    socketClient.readFolder({ targetPath: parentPath });
  }
});

// Handle delete resource response from server
socketClient.handleDeleteResource((data: any) => {
  console.log(`[IDE] Resource deleted: ${data.targetPath}`);
  deletingResources.value.delete(data.targetPath);

  // Close any open tabs for the deleted file or files within deleted folder
  const tabsToClose = openTabs.tabs.filter(tab =>
    tab.filePath === data.targetPath || tab.filePath.startsWith(data.targetPath + '/')
  );

  tabsToClose.forEach((tab) => {
    const tabIndex = openTabs.tabs.findIndex(t => t.filePath === tab.filePath);
    if (tabIndex !== -1) {
      deleteTab(tab, tabIndex);
    }
  });
});
</script>

<style lang="css" scoped>
@reference "tailwindcss";

#drop-zone {
  @apply flex h-full min-h-[100px] w-full hover:border-dashed hover:border border-sky-500 rounded-lg transition-all duration-200;
}

.drag-over {
  @apply bg-blue-50 dark:bg-sky-950;
}
</style>
