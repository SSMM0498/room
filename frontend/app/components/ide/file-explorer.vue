<template>
  <div class="relative w-full flex flex-col">
    <div class="flex flex-col w-full border-accented border-b">
      <div class="flex w-full items-center justify-between mb-2">
        <div class="flex w-full items-center justify-center gap-1">
          <UIcon name="i-ci:folders" />
          <h5>Workspace</h5>
        </div>
        <div class="flex items-center gap-1">
          <UButton id="btn-create-file" variant="ghost" square size="xs" color="neutral"
            @click.prevent="handleCreateFile" icon="i-tdesign:file-add">
          </UButton>
          <UButton id="btn-create-folder" variant="ghost" square size="xs" color="neutral"
            @click.prevent="handleCreateFolder" icon="i-tdesign-folder-add">
          </UButton>
          <UPopover>
            <UButton id="btn-more-file" variant="ghost" square size="xs" color="neutral" icon="i-tdesign-more"
              :loading="isUploading">
            </UButton>
            <template #content>
              <div class="flex flex-col p-2 gap-2">
                <UButton id="btn-upload-file" variant="ghost" square size="sm" color="primary"
                  @click.prevent="handleUpload" icon="i-tdesign-upload " label="upload" :loading="isUploading">
                </UButton>
                <UButton id="btn-download-file" variant="ghost" square size="sm" color="primary"
                  @click.prevent="handleDownload" icon="i-tdesign-download" label="download" :loading="isDownloading">
                </UButton>
              </div>
            </template>
          </UPopover>
        </div>
      </div>
      <UInput id="input-create-resource" v-if="resourceCreation.isCreating && activeResources.length && activeResources[0]!!.path == '/workspace'
      " type="text" v-model="resourceCreation.name" @vue:mounted="({ el }: any): void => el.focus()"
        @blur.prevent="(event: FocusEvent) => resourceCreation.isCreating = false"
        @keyup.prevent.escape="(event: KeyboardEvent) => resourceCreation.isCreating = false"
        @keyup.prevent.enter="handleCreateSubmit" />
    </div>
    <div class="w-full flex flex-col h-full overflow-y-auto overflow-x-hidden">
      <Suspense>
        <ide-directory-tree v-if="directoryTree.workspace" :depth="1" :directory="directoryTree.workspace"
          @open-folder="openFolder" @open-file="openFile" @delete-resource="deleteResource"
          @move-resource="moveResource" />
      </Suspense>
      <div id="drop-zone" mt-1 @click.prevent="handleBackgroundClick" @dragover.prevent="handleDragOver"
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
  toggleOpenFolder, // Add this
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

socketClient.handleReadFolder((data: ReadFolderResponse) => {
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
  const deletedPath = getObjectPath(data.targetPath);
  objectPath.del(directoryTree, deletedPath);
  socketClient.deleteResource(data)
};

const moveResource = (data: MoveEventType) => {
  const deletedPath = getObjectPath(data.targetPath);
  objectPath.del(directoryTree, deletedPath);
  socketClient.moveResource(data)
};
</script>

<style lang="css" scoped>
@reference "tailwindcss";

#drop-zone {
  @apply flex h-full min-h-[100px] w-full border-dashed hover:border-2 border-sky-500 rounded-lg transition-all duration-200;
}

.drag-over {
  @apply border-2 border-blue-500 bg-blue-50 dark:bg-sky-950;
}
</style>
