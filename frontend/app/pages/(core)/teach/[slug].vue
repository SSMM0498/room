<template>

  <Head>
    <Title>{{ currentCourse?.title ?? 'Loading' }}</Title>
  </Head>

  <div id="ide-wrapper" class="flex w-full h-full">
    <UModal v-model:open="isWorkSpaceChecklistOpen" :prevent-close="!isReady" :ui="{ overlay: 'bg-gray-900/75' }">
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

const route = useRoute();
const router = useRouter();
const toast = useToast();

const { currentCourse, fetchCourseBySlug } = useCourses();
const {
  isReady,
  isRecording,
  micVolume,
  setupMedia,
  initializeRecorder,
  stopRecording,
  setupVcsWatcher,
  recorder,
} = useRecorder();
const { socketClient, getSocketUrl } = useSocket();
const { ensureWorkspaceIsRunning, progressMessage } = useWorkspace();
useCourseContent();
const {
  directoryTree,
  activeTab,
  openTabs,
  openFolders,
  handleFileDelete,
  handleDirectoryDelete,
  handleRename,
  setSocketConnected,
} = useIDE();

type SessionState = 'checklist' | 'starting' | 'connecting' | 'ready';
const sessionState = ref<SessionState>('checklist');
const isWorkSpaceChecklistOpen = ref(true);
const isSettingUpMic = ref(false);

const loading = ref(true);
const isConnected = ref(false);
const socketError = ref<Error | null>(null);
const slug = route.params.slug as string;

// Recording state
let recordingTimerInterval: number | null = null;

// Mouse position tracking using VueUse
const { x: mouseX, y: mouseY } = useMouse();

// Initialize recorder with full structure but only tab tracking active
onMounted(() => {
  initializeRecorder({
    getUIState: () => {
      const _directoryTree = JSON.parse(JSON.stringify(directoryTree));
      const _openFolders = openFolders.value;
      const _openTabs = openTabs.tabs.map(tab => tab.filePath)
      const _activeTab = activeTab.filePath
      const _mouseX = mouseX.value;
      const _mouseY = mouseY.value;
      return {
        mouse: { x: _mouseX, y: _mouseY },
        scrolls: {},
        ide: {
          activePanel: 'editor',
          tabs: {
            editor: {
              openFiles: _openTabs,
              activeFile: _activeTab || null
            },
            terminal: {
              openTerminals: [],
              activeTerminal: null
            },
          },
        },
        fileTree: {
          expandedPaths: _openFolders,
          tree: _directoryTree || null
        },
        browser: { url: '' },
      }
    },
    getWorkspaceState: () => {
      const files: Record<string, string> = {};
      for (const tab of openTabs.tabs) {
        files[tab.filePath] = tab.fileContent;
      }
      return {
        files,
        terminals: {},
        processes: []
      };
    },
  });
});

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
  await fetchCourseBySlug(slug);

  if (!currentCourse.value) {
    toast.add({
      title: 'Error',
      description: 'Course not found.',
      color: 'error'
    });
    router.push('/');
    return;
  }

  const lessonCourseId = currentCourse.value.id;

  // Start the workspace for this specific lesson
  await startWorkspace(lessonCourseId);
}

const startWorkspace = async (courseId: string) => {
  try {
    sessionState.value = 'starting';

    const workspace = await ensureWorkspaceIsRunning(courseId);

    if (!workspace) {
      toast.add({ title: 'Failed to Start Workspace', color: 'error' });
      sessionState.value = 'checklist';
      loading.value = false;
      return;
    }

    sessionState.value = 'connecting';
    progressMessage.value = 'Connecting to the IDE...';

    const k8sName = `${workspace.name}`;
    const workspaceWsUrl = getSocketUrl(k8sName);

    console.log(`[Teach] Connecting to WebSocket at: ${workspaceWsUrl}`);

    // Initialize the socket connection
    socketClient.initialize(workspaceWsUrl);

    // Set up connection callback
    socketClient.connect(() => {
      console.log('[Teach] Socket connected successfully');
      isConnected.value = true;
      setSocketConnected(true);
      loading.value = false;
      sessionState.value = 'ready';
      isWorkSpaceChecklistOpen.value = false;

      // Initialize recording mode and VCS watcher
      socketClient.init('RECORDING', (response: any) => {
        // Set initial commit hash in VcsWatcher if provided
        if (response.initialCommitHash && recorder.value) {
          recorder.value.getVcsWatcher().setInitialCommitHash(response.initialCommitHash);
          console.log('[Teach] Initial commit hash set:', response.initialCommitHash.substring(0, 8));
        }
      });
      setupVcsWatcher(socketClient);

      // Start file watching
      setupFileWatching();

      toast.add({
        title: 'IDE Connected!',
        color: 'success'
      });
    });

    // Monitor connection errors
    socketClient.onConnectError((err: Error) => {
      console.error('[Teach] Socket connection error:', err);
      socketError.value = err;
      loading.value = false;
      toast.add({
        title: 'Connection Error',
        description: 'Failed to connect to workspace.',
        color: 'error'
      });
    });

    socketClient.onDisconnect(() => {
      console.log('[Teach] Socket disconnected');
      isConnected.value = false;
      setSocketConnected(false);
    });
  } catch (err: any) {
    console.error('[Teach] Failed to start workspace:', err);
    socketError.value = err;
    loading.value = false;
    toast.add({
      title: 'Error',
      description: 'Failed to start workspace.',
      color: 'error'
    });
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

const micCheckClass = computed(() => {
  if (isReady.value) {
    return 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-300';
  }
  return 'bg-gray-50 dark:bg-gray-800';
});

// Cleanup on component unmount
onUnmounted(() => {
  // Stop recording timer
  if (recordingTimerInterval !== null) {
    clearInterval(recordingTimerInterval);
    recordingTimerInterval = null;
  }

  // Stop recording if active
  if (isRecording.value) {
    stopRecording();
  }

  if (socketClient.isConnected) {
    console.log('[Teach] Disconnecting socket on unmount');
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
