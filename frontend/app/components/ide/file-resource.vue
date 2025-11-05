<template>
	<div class="flex relative w-full justify-between items-center cursor-pointer" :title="item.path"
		:style="{ paddingLeft: depth * 8 + 'px' }" draggable="true" @dragstart="handleDragStart"
		@dragend="handleDragEnd" @dragover.prevent="handleDragOver" @dragleave.prevent="handleDragLeave"
		@drop.prevent="handleDrop" :class="{ 'bg-primary/20': isDragTarget && item.type === 'directory' }" @click="(event: MouseEvent) => {
			if (isRenaming || event.ctrlKey || event.metaKey) {
				return;
			}65
			handleOpen(item);
		}">
		<UInput v-if="isRenaming" variant="subtle" type="text" v-model="newResourceName" autofocus
			@blur.prevent="(event: FocusEvent) => isRenaming = false"
			@keyup.prevent.enter="(ev: KeyboardEvent) => handleRenameSubmit(item.path)"
			@keyup.prevent.escape="handleRenameCancel" />
		<div class="flex items-center w-full" v-else>
			<widget-file-icon class="ml-1 mr-2 flex-none" :path="item.name" :is-directory="item.type && item.type === 'directory'"
				:is-directory-open="item.isOpen" />
			<p class="file-resource-name text-sm w-full max-w-[125px]">{{ item.name }}</p>
		</div>
		<UPopover absolute>
			<UButton variant="soft" square size="xs" color="primary" icon="i-tdesign-more" @click.stop>
			</UButton>
			<template #content>
				<div class="flex flex-col items-start justify-start p-1.5">
					<UButton variant="ghost" size="xs" mr-1 v-show="!isRenaming" icon="i-tdesign:edit" @click.prevent="(event: MouseEvent) => {
						openResource = false;
						isRenaming = true;
					}">
					</UButton>
					<UButton variant="ghost" color="error" size="xs" v-show="!isRenaming" icon="i-tdesign:delete"
						@click.prevent="(event: MouseEvent) => {
							openResource = false;
							emit('delete-resource', { targetPath: item.path });
						}"></UButton>
				</div>
			</template>
		</UPopover>
	</div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core';
import type { ResourceNode, ReadFileEventType, ReadFolderEventType, DeleteEventType, MoveEventType } from '~~/types/file-tree';

const { depth, item } = defineProps({
	depth: {
		type: Number,
		required: true,
	},
	item: {
		type: Object as PropType<ResourceNode>,
		required: true,
	},
});

const emit = defineEmits<{
	(event: "open-file", data: ReadFileEventType): void;
	(event: "open-folder", data: ReadFolderEventType): void;
	(event: "delete-resource", data: DeleteEventType): void;
	(event: "move-resource", data: MoveEventType): void;
}>();

const { activeResources, toggleActive } = useIDE();
const isRenaming = ref(false);
const newResourceName = ref(item.name);
const isDragTarget = ref(false);
let folderOpenTimeout: NodeJS.Timeout | null = null;
const renamingContainer = ref<HTMLElement | null>(null);
const openResource = ref(false);

onClickOutside(renamingContainer, () => {
	if (isRenaming.value) {
		isRenaming.value = false;
	}
});

const handleRenameSubmit = (path: string) => {
	isRenaming.value = false;
	const newPath = path.split("/").slice(0, -1).join("/") + "/" + newResourceName.value;
	emit("move-resource", {
		targetPath: path,
		newPath,
	});
};

const handleRenameCancel = () => {
	newResourceName.value = item.name; // Reset to original name
	isRenaming.value = false;
};

const handleOpen = (item: ResourceNode) => {
	if (item.type === "directory") {
		emit("open-folder", { targetPath: item.path });
		item.isOpen = !item.isOpen;
	} else {
		emit("open-file", { targetPath: item.path });
	}
};

const handleDragStart = (event: DragEvent) => {
	event.stopPropagation();
	// Add item to selection based on Ctrl key state
	if (!activeResources.some(r => r.path === item.path)) {
		// If Ctrl is not pressed, clear other selections first
		toggleActive(item, event.ctrlKey || event.metaKey);
	}
};

const handleDragEnd = () => {
	if (folderOpenTimeout) {
		clearTimeout(folderOpenTimeout);
		folderOpenTimeout = null;
	}
};

const handleDragOver = (event: DragEvent) => {
	if (item.type !== 'directory' || activeResources.some(r => r.path === item.path)) {
		return;
	}

	event.preventDefault();
	isDragTarget.value = true;
	console.log('Drag over folder');

	// Auto-open folder after hovering for 1 second
	if (!folderOpenTimeout && !item.isOpen) {
		console.log('Opening folder in 1 second');
		folderOpenTimeout = setTimeout(() => {
			emit('open-folder', { targetPath: item.path });
			item.isOpen = true;
		}, 1000);
	}
};

const handleDragLeave = () => {
	isDragTarget.value = false;
	if (folderOpenTimeout) {
		clearTimeout(folderOpenTimeout);
		folderOpenTimeout = null;
	}
};

const handleDrop = (event: DragEvent) => {
	event.stopPropagation();
	isDragTarget.value = false;

	// Get the target directory path
	const targetPath = item.type === 'directory'
		? item.path
		: item.path.substring(0, item.path.lastIndexOf('/'));

	// Move all selected resources to the target directory
	activeResources.forEach(resource => {
		if (resource.path === targetPath) return;
		const newPath = `${targetPath}/${resource.name}`;
		emit('move-resource', {
			targetPath: resource.path,
			newPath: newPath
		});
	});
};
</script>

<style scoped lang="css">
@reference "tailwindcss";

.file-resource-name {
	text-overflow: ellipsis;
	overflow: hidden;
	white-space: nowrap;
}

.icon {
	width: 18px;
	height: 18px;
	margin-right: 0.5rem;
}
</style>
