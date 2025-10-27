<template>
	<div class="editor w-full h-full overflow-hidden">
		<nav class="flex items-center flex-nowrap w-full rounded-t-lg border-b border-gray-200 dark:border-gray-800 text-sm justify-start gap-1">
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
		}" :language="language" :value="activeTab.fileContent" :onChange="onCodeChange">
		</Editor>
	</div>
</template>
<script setup lang="ts">
import { getFileExtension } from '~/utils/file-tree';
import Editor from "@guolao/vue-monaco-editor";
import map from '~/utils/lang-map';
import { debounce, type ActiveFile } from '~~/types/file-tree';

const { activeTab, openTabs, setActiveTab, setTabContent, deleteTab, savingFiles } = useIDE();
const colorMode = useColorMode()
const { socketClient } = useSocket();
const isSaving = ref(false);

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
