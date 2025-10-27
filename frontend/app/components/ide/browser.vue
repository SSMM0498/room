<template>
	<div class="browser rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
		<nav
			class="flex items-center flex-nowrap w-full rounded-t-lg p-1 border-b border-gray-200 dark:border-gray-800 text-sm justify-between gap-2">
			<UIcon name="i-ph-globe" class="size-4" />
			<h5>Browser</h5>
			<div class="ml-1 flex gap-1">
				<!-- <UButton square variant="ghost" color="neutral" size="xs" icon="i-heroicons:arrow-small-left-20-solid">
				</UButton> -->
				<UButton square variant="ghost" color="neutral" size="xs" icon="i-heroicons:arrow-path-solid"
					@click="refresh"></UButton>
				<!-- <UButton class="mr-2" square variant="ghost" color="neutral" size="xs" icon="i-heroicons:arrow-small-right-20-solid">
				</UButton> -->
			</div>
			<UInput v-model="url" type="text" class="w-[100%]" @keyup.enter="navigate" placeholder="https://url"
				size="xs" />
			<UButton square variant="ghost" color="neutral" size="xs" icon="i-heroicons:arrow-top-right-on-square"
				:to="url" target="_blank"></UButton>
		</nav>
		<iframe v-if="url" ref="iframeElementRef" :src="url" w-full h-full bg-transparent
			sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-same-origin allow-scripts"
			allow="geolocation; microphone; camera; payment; autoplay; serial; cross-origin-isolated" />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const iframeElementRef = ref<HTMLIFrameElement | null>(null);
const { url: defaultUrl, changeURL } = useIDE();
const url = ref<string>(defaultUrl.value);

const { socketClient } = useSocket();

const refresh = () => {
	if (iframeElementRef.value) {
		iframeElementRef.value.src = url.value;
	} else {
		setTimeout(() => {
			refresh();
		}, 100);
	}
};

const navigate = () => {
	changeURL(url.value);
};

socketClient.handlePreview((previewData: any) => {
	changeURL(previewData.url);
	url.value = previewData.url;
	refresh();
});

watch(defaultUrl, () => {
	refresh();
});
</script>
