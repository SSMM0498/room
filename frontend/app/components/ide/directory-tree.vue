<template>
  <template v-for="item in directory.content" :key="item.path">
    <ide-file-resource :id="'resource-' + item.path.replaceAll('/', '-')" class="py-1 px-3 hover:bg-primary/20 rounded-1"
      :class="{ 'bg-primary/10': isSelected(item) }" :item="item" :depth="depth"
      @click="(event: MouseEvent) => handleItemClick(event, item)"
      @open-folder="(data: ReadFolderEventType) => emit('open-folder', data)"
      @open-file="(data: ReadFileEventType) => emit('open-file', data)"
      @delete-resource="(data: DeleteEventType) => emit('delete-resource', data)"
      @move-resource="(data: MoveEventType) => emit('move-resource', data)" />
    <UInput variant="subtle" v-if="resourceCreation.isCreating && (activeResources.length > 0 ? activeResources[0]!.path : '/workspace') == item.path"
      type="text" v-model="resourceCreation.name" autofocus
      @blur.prevent="(event: FocusEvent) => resourceCreation.isCreating = false"
      @keyup.prevent.enter="handleCreateSubmit" />
    <ide-directory-tree v-if="item.content !== null && item.isOpen" :depth="depth + 1" :directory="item"
      @open-folder="(data: ReadFolderEventType) => emit('open-folder', data)"
      @open-file="(data: ReadFileEventType) => emit('open-file', data)"
      @delete-resource="(data: DeleteEventType) => emit('delete-resource', data)"
      @move-resource="(data: MoveEventType) => emit('move-resource', data)" />
  </template>
</template>

<script setup lang="ts">
import type { DirectoryTreeType, ReadFileEventType, ReadFolderEventType, DeleteEventType, MoveEventType, Resource } from '~~/types/file-tree';


const { resourceCreation, activeResources, toggleActive, handleCreateSubmit } = useIDE();

const { depth, directory } = defineProps({
  depth: {
    type: Number,
    required: true,
  },
  directory: {
    type: Object as PropType<{
      type: "directory" | "file";
      path: string;
      name: string;
      content: DirectoryTreeType;
    }>,
    required: true,
  },
});

const emit = defineEmits<{
  (event: "open-file", data: ReadFileEventType): void;
  (event: "open-folder", data: ReadFolderEventType): void;
  (event: "delete-resource", data: DeleteEventType): void;
  (event: "move-resource", data: MoveEventType): void;
}>();

const isSelected = (item: Resource) => {
  return activeResources.some(r => r.path === item.path);
};

const handleItemClick = (event: MouseEvent, item: Resource) => {
  toggleActive(item, event.ctrlKey || event.metaKey);
};
</script>
