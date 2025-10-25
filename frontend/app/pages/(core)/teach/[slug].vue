<template>
  <Head>
    <Title>{{ currentCourse?.title ?? 'Loading' }}</Title>
  </Head>
  <div id="ide-wrapper" class="flex w-full h-full px-2 pb-2">
    <UModal v-model:open="isChecklistOpen" :prevent-close="!isReady" :ui="{ overlay: 'bg-gray-900/75' }">
      <template #content>
        <UCard>
          <template #header>
            <h2 class="text-xl font-bold">Ready to Record?</h2>
          </template>

          <div class="space-y-4">
            <p class="text-gray-600 dark:text-gray-300">
              Before you begin, let's make sure everything is set up correctly.
            </p>

            <div class="p-4 rounded-lg" :class="micCheckClass">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <UIcon :name="isReady ? 'i-heroicons-check-circle-20-solid' : 'i-heroicons-microphone'"
                    class="h-6 w-6" />
                  <span class="font-semibold">Microphone Access</span>
                </div>
                <UButton v-if="!isReady" @click="setupMicrophone" :loading="isSettingUpMic">
                  Allow Access
                </UButton>
                <span v-else class="text-sm font-medium text-green-600 dark:text-green-300">Ready</span>
              </div>

              <!-- NEW: Microphone Visualizer -->
              <div v-if="isReady" class="mt-4 flex items-center justify-center gap-1 h-10">
                <div v-for="n in 20" :key="n"
                  class="w-2 rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-75"
                  :style="{ height: `${Math.min(100, (micVolume * 10) * (n / 5))}%` }"
                  :class="{ '!bg-primary-500': micVolume * 5 > n }"></div>
              </div>

            </div>
          </div>

          <template #footer>
            <div class="flex justify-end">
              <UButton size="lg" @click="startSession" :disabled="!isReady" icon="i-heroicons-video-camera-20-solid">
                Go to the IDE
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
    <ide-wrap :loading="loading" />
  </div>
</template>
<script lang="ts" setup>
import type { WatchResponse, RenameData } from '~~/types/file-tree';
import objectPath from 'object-path';

definePageMeta({
  alias: ["/teach/:slug()"],
  name: "teach-page",
  layout: "ide"
})

const { currentCourse, fetchCourseBySlug } = useCourses();
const { isReady, micVolume, setupMedia } = useRecorder();
const { socketClient, getSocketUrl } = useSocket();
const { ensureWorkspaceIsRunning, progressMessage } = useWorkspace();
const {
  directoryTree,
  activeTab,
  openFolders,
  handleFileDelete,
  handleDirectoryDelete,
  handleRename,
} = useIDE();
const route = useRoute()
const toast = useToast();

type SessionState = 'checklist' | 'starting' | 'connecting' | 'ready';
const sessionState = ref<SessionState>('checklist');
const isChecklistOpen = ref(true);
const isSettingUpMic = ref(false);
const isConnected = ref(false);
const socketError = ref<Error | null>(null);
const loading = ref(true);

const setupMicrophone = async () => {
  isSettingUpMic.value = true;
  const success = await setupMedia();
  if (!success) {
    toast.add({
      title: 'Microphone Access Denied',
      description: 'Please allow microphone access in your browser settings to start recording.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    });
  }
  isSettingUpMic.value = false;
};

const startSession = async () => {
  if (!currentCourse.value) {
    const slug = route.params.slug as string
    await fetchCourseBySlug(slug)
    toast.add({ title: 'Error', description: 'Course data is missing.', color: 'error' });
    return;
  }
  sessionState.value = 'starting';

  const workspace = await ensureWorkspaceIsRunning(currentCourse.value.id);

  if (!workspace) {
    toast.add({ title: 'Failed to Start Workspace', color: 'error' });
    sessionState.value = 'checklist';
    return;
  }

  sessionState.value = 'connecting';
  progressMessage.value = 'Connecting to the IDE...';

  const k8sName = `${workspace.name}`;
  const workspaceWsUrl = getSocketUrl(k8sName);

  console.log(`[Session] Connecting to WebSocket at: ${workspaceWsUrl}`);

  try {
    // Initialize the socket connection
    socketClient.initialize(workspaceWsUrl);

    // Set up connection callback
    socketClient.connect(() => {
      console.log('[Session] Socket connected successfully');
      isConnected.value = true;
      loading.value = false;

      // Start file watching
      setupFileWatching();
    });

    // Monitor connection errors
    socketClient.onConnectError((err: Error) => {
      console.error('[Session] Socket connection error:', err);
      socketError.value = err;
      loading.value = false;
    });

    socketClient.onDisconnect(() => {
      console.log('[Session] Socket disconnected');
      isConnected.value = false;
    });
  } catch (err: any) {
    console.error('[Session] Failed to initialize socket:', err);
    socketError.value = err;
    loading.value = false;
  }
};

// Set up file watching similar to arkad-app/pages/ide/index.vue
const setupFileWatching = () => {
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
};

watch(isConnected, (newVal) => {
  if (newVal) {
    toast.add({ title: 'IDE Connected!', color: 'success' });
    sessionState.value = 'ready';
    isChecklistOpen.value = false;
  }
});

watch(socketError, (err) => {
  if (err) {
    toast.add({ title: 'Connection Failed', description: err.message, color: 'error' });
    sessionState.value = 'checklist';
  }
});

const micCheckClass = computed(() => {
  if (isReady.value) {
    return 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-300';
  }
  return 'bg-gray-50 dark:bg-gray-800';
});

// Cleanup on component unmount
onUnmounted(() => {
  if (socketClient.isConnected) {
    console.log('[Session] Disconnecting socket on unmount');
    socketClient.disconnect();
  }
});
</script>
<style lang="css" scoped>
@reference "tailwindcss";

.panel {
  @apply flex flex-col text-left overflow-hidden grow w-full h-full rounded-lg;
}
</style>
