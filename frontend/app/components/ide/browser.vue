<template>
	<div class="browser rounded-lg">
		<nav
			class="flex items-center flex-nowrap w-full rounded-t-lg p-1 border-b border-gray-200 dark:border-gray-700 text-sm justify-between gap-2">
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
const { recorder } = useRecorder();

const refresh = () => {
	if (iframeElementRef.value) {
		// Unregister old scroll watcher before refresh
		unregisterIframeScrollWatcher();

		iframeElementRef.value.src = url.value;

		// Re-register scroll watcher after iframe loads
		nextTick(() => {
			registerIframeScrollWatcher();
		});
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

// Function to register iframe scroll watching
const registerIframeScrollWatcher = () => {
	if (!iframeElementRef.value || !recorder.value) {
		return;
	}

	try {
		// Wait for iframe to load before trying to access its content
		const iframe = iframeElementRef.value;

		// For same-origin iframes, we can access the contentWindow
		// For cross-origin, we'll need to register the iframe itself
		const loadHandler = () => {
			try {
				// Try to access iframe's document (will fail for cross-origin)
				const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

				if (iframeDocument && iframeDocument.documentElement) {
					// Same-origin: register the iframe's document element or body
					const scrollableElement = iframeDocument.documentElement || iframeDocument.body;
					if (scrollableElement) {
						recorder.value!.getScrollWatcher().registerScrollable(
							scrollableElement as HTMLElement,
							'browser',
							'default'
						);
						console.log('[Browser] Registered scroll watcher for iframe content');
					}
				}
			} catch (e) {
				// Cross-origin iframe - cannot access content
				console.warn('[Browser] Cannot register scroll for cross-origin iframe:', e);
			}
		};

		// Add load event listener to iframe
		iframe.addEventListener('load', loadHandler);

		// If already loaded, try immediately
		if (iframe.contentDocument) {
			loadHandler();
		}
	} catch (error) {
		console.error('[Browser] Error registering scroll watcher:', error);
	}
};

// Function to unregister iframe scroll watching
const unregisterIframeScrollWatcher = () => {
	if (!iframeElementRef.value || !recorder.value) {
		return;
	}

	try {
		const iframe = iframeElementRef.value;
		const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;

		if (iframeDocument && iframeDocument.documentElement) {
			const scrollableElement = iframeDocument.documentElement || iframeDocument.body;
			if (scrollableElement) {
				recorder.value.getScrollWatcher().unregisterScrollable(scrollableElement as HTMLElement);
				console.log('[Browser] Unregistered scroll watcher for iframe content');
			}
		}
	} catch (error) {
		// Silently fail for cross-origin or other errors during cleanup
		console.warn('[Browser] Could not unregister scroll watcher:', error);
	}
};

onMounted(() => {
	// Register scroll watcher when component mounts
	// Use nextTick to ensure iframe ref is available
	nextTick(() => {
		registerIframeScrollWatcher();
	});
});

onUnmounted(() => {
	// Unregister scroll watcher when component unmounts
	unregisterIframeScrollWatcher();
});
</script>
