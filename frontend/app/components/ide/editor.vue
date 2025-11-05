<template>
	<div class="editor w-full h-full overflow-hidden">
		<nav class="flex items-center flex-nowrap w-full rounded-t-lg border-b border-gray-200 dark:border-gray-700 text-sm justify-start gap-1 mb-1">
			<UIcon name="i-ph-code" class="size-4 mx-2" />
			<h5>Editor</h5>
			<div class="ml-1 flex items-center justify-center cursor-pointer border-r p-1 border-gray-200 dark:border-gray-800 hover:bg-black/10"
				:class="{ active: openTab.filePath === activeTab.filePath }" v-for="(openTab, key) in openTabs.tabs"
				:key="openTab.filePath">
				<widget-file-icon class="mr-1 flex-none" :path="openTab.filePath" :is-directory="false"
					:is-directory-open="false" />
				<p class="mr-1" @click="(event) => setActiveTab(openTab)">
					{{ openTab.filePath.split("/").splice(-1)[0] }}
				</p>
				<UIcon v-if="savingFiles.has(openTab.filePath)" name="i-heroicons:arrow-path" class="animate-spin mr-1 text-blue-500" />
				<UButton @click="(event) => deleteTab(openTab, key)" icon="i-heroicons:x-mark-20-solid" size="xs"
					variant="ghost" :padded="false" :square="true" color="neutral">
				</UButton>
			</div>
			<UButton class="ml-1 my-1" icon="i-heroicons:plus-20-solid" size="xs" variant="soft" color="primary">
			</UButton>
		</nav>
		<Editor class="monaco" :theme="theme" :options="{
			minimap: {
				enabled: false
			}
		}" :language="language" :value="activeTab.fileContent" :onChange="onCodeChange" :onMount="onEditorMount">
		</Editor>
	</div>
</template>
<script setup lang="ts">
import { getFileExtension } from '~/utils/file-tree';
import Editor from "@guolao/vue-monaco-editor";
import map from '~/utils/lang-map';
import { debounce, type ActiveFile } from '~~/types/file-tree';

const { activeTab, openTabs, setActiveTab, setTabContent, deleteTab, savingFiles, setCursorPosition } = useIDE();
const colorMode = useColorMode()
const { socketClient } = useSocket();
const { recorder } = useRecorder();
const { player } = usePlayer();
const isSaving = ref(false);
const editorInstance = ref<any>(null);
const scrollableElement = ref<HTMLElement | null>(null);

const theme = computed(() => colorMode.value === 'dark'
	? 'vs-dark'
	: 'vs-light',
)

const language = computed(() => {
	if (activeTab && activeTab.filePath) {
		const languages = map.languages(getFileExtension(activeTab.filePath) ?? '')
		return (languages.length > 0 && languages[0]) ? languages[0] : 'plaintext'
	} else {
		return 'plaintext'
	}
})

const debouncedUpdate = debounce((filePath: string, fileContent: string) => {
	isSaving.value = true;
	savingFiles.value.add(filePath);
	socketClient.updateFile({
		targetPath: filePath,
		fileContent: fileContent
	})
}, 1000);

const onCodeChange = (value: string | undefined) => {
	if (value) {
		const tab: ActiveFile = { filePath: activeTab.filePath, fileContent: value };
		setActiveTab(tab);
		setTabContent(tab);
		debouncedUpdate(activeTab.filePath, value);
	}
};

const onEditorMount = (editor: any) => {
	editorInstance.value = editor;

	// Track cursor position changes
	editor.onDidChangeCursorPosition((e: any) => {
		setCursorPosition(e.position.lineNumber, e.position.column);
	});

	// Set initial cursor position
	const position = editor.getPosition();
	if (position) {
		setCursorPosition(position.lineNumber, position.column);
	}

	// Get the scrollable DOM element from Monaco editor
	// Monaco editor's scrollable element has the class 'monaco-scrollable-element'
	const domNode = editor.getDomNode();
	if (domNode) {
		const monacoScrollable = domNode.querySelector('.monaco-scrollable-element');
		if (monacoScrollable) {
			scrollableElement.value = monacoScrollable as HTMLElement;

			// Register the scrollable element for recording
			if (recorder.value && activeTab.filePath) {
				recorder.value.getScrollWatcher().registerScrollable(
					scrollableElement.value,
					'editor',
					activeTab.filePath
				);
			}
		}
	}

	// Register editor for input recording (typing and paste)
	if (recorder.value && activeTab.filePath) {
		recorder.value.getEditorInputWatcher().registerEditor(editor, activeTab.filePath);
	}

	// Register editor for input playback
	if (player.value && activeTab.filePath) {
		player.value.getEditorInputPlayer().registerEditor(activeTab.filePath, editor);
	}
};

// Handle update file response from server
socketClient.handleUpdateFile((data: any) => {
	console.log(`[IDE] File updated: ${data.targetPath}`);
	isSaving.value = false;
	savingFiles.value.delete(data.targetPath);
});

// Handle delete resource response from server (in editor context)
socketClient.handleDeleteResource((data: any) => {
	console.log(`[IDE] Resource deleted in editor: ${data.targetPath}`);

	// Close tabs for deleted files
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

// Watch for active tab changes to update the scroll watcher and editor input watcher registrations
watch(() => activeTab.filePath, (newFilePath, oldFilePath) => {
	if (scrollableElement.value && recorder.value) {
		// Unregister the old file path
		if (oldFilePath) {
			recorder.value.getScrollWatcher().unregisterScrollable(scrollableElement.value);
		}

		// Register with the new file path
		if (newFilePath) {
			recorder.value.getScrollWatcher().registerScrollable(
				scrollableElement.value,
				'editor',
				newFilePath
			);
		}
	}

	// Update editor input watcher registration when switching tabs
	if (editorInstance.value && recorder.value) {
		// Unregister the old editor
		if (oldFilePath) {
			recorder.value.getEditorInputWatcher().unregisterEditor(editorInstance.value);
		}

		// Register with the new file path
		if (newFilePath) {
			recorder.value.getEditorInputWatcher().registerEditor(editorInstance.value, newFilePath);
		}
	}

	// Update editor input player registration when switching tabs
	if (editorInstance.value && player.value) {
		// Unregister the old editor
		if (oldFilePath) {
			player.value.getEditorInputPlayer().unregisterEditor(oldFilePath);
		}

		// Register with the new file path
		if (newFilePath) {
			player.value.getEditorInputPlayer().registerEditor(newFilePath, editorInstance.value);
		}
	}
});

// Cleanup: Unregister scrollable element and editor when component unmounts
onUnmounted(() => {
	if (scrollableElement.value && recorder.value) {
		recorder.value.getScrollWatcher().unregisterScrollable(scrollableElement.value);
	}

	// Unregister editor from input watcher
	if (editorInstance.value && recorder.value) {
		recorder.value.getEditorInputWatcher().unregisterEditor(editorInstance.value);
	}

	// Unregister editor from input player
	if (activeTab.filePath && player.value) {
		player.value.getEditorInputPlayer().unregisterEditor(activeTab.filePath);
	}
});
</script>
<style lang="css">
@reference "tailwindcss";

.monaco {
	border-radius: 5px;
	background-color: transparent !important;
}

.monaco-editor,
.monaco-editor-background {
	background-color: transparent !important;
}

.monaco-editor .margin {
	background-color: transparent !important;
}

.monaco>div {
	border-radius: 5px;
	width: 100%;
	height: 100%;
}

.editor .active {
	@apply border-blue-600 border-b-2 border-solid bg-black/10;
}
</style>
