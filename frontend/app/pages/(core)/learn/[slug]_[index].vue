<template>
  <Head>
    <Title>{{ currentCourse?.title ?? 'Loading' }}</Title>
  </Head>

  <div class="flex flex-col w-full h-full relative">
    <div v-if="currentCourse && currentCourse.type === 'cursus' && activePlaylistItem"
      class="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ currentCourse.title }}
          </h2>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            Lesson {{ currentItemIndex + 1 }} of {{ currentCourse.items?.length || 0 }}: {{
              activePlaylistItem.expand?.course?.title }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton v-if="currentItemIndex > 0" size="sm" color="neutral" variant="soft" @click="navigateToPrevious">
            Previous
          </UButton>
          <UButton v-if="currentItemIndex < (currentCourse.items?.length || 0) - 1" size="sm" color="primary"
            @click="navigateToNext">
            Next Lesson
          </UButton>
        </div>
      </div>
    </div>

    <!-- IDE Wrapper -->
    <div class="flex-1 flex w-full h-full overflow-hidden relative">
      <ide-wrap :loading="loading" />

      <!-- Fake Mouse Cursor using mouse.css classes -->
      <div
        v-if="isPlaying"
        class="player-mouse"
        :class="fakeCursorClass"
        :style="{
          left: `${fakeCursorPos.x}px`,
          top: `${fakeCursorPos.y}px`,
        }"
      >
        <div class="player-mouse-light"></div>
      </div>

      <!-- Playing Blocker Overlay -->
      <div
        class="playing-blocker absolute bg-transparent w-screen h-screen inset-0 z-40 cursor-normal"
        @click.prevent
        @mousedown.prevent
        @mouseup.prevent
        @keydown.prevent
      ></div>
    </div>

    <!-- Player Controller (auto-hide at bottom) -->
    <player-controller
      :is-playing="isPlaying"
      :is-ready="isReady"
      :current-time="formattedCurrentTime"
      :duration="formattedDuration"
      v-model:current-time-ms="currentTime"
      :duration-ms="duration"
      @toggle-play-pause="togglePlayPause"
      @seek="handleSeek"
      @skip-forward="skipForward"
      @skip-backward="skipBackward"
    />
  </div>
</template>

<script lang="ts" setup>
import type { WatchResponse, RenameData } from '~~/types/file-tree';
import objectPath from 'object-path';

definePageMeta({
  alias: ["/learn/:slug()_:index(\\d+)"],
  name: "learn-page",
  layout: "ide"
})

const route = useRoute();
const router = useRouter();
const toast = useToast();

const { currentCourse, currentItemIndex, activePlaylistItem, fetchCourseBySlug } = useCourses();
const { socketClient, getSocketUrl } = useSocket();
const { ensureWorkspaceIsRunning, progressMessage } = useWorkspace();
const { fetchCourseContent, downloadTimeline, getAudioUrl } = useCourseContent();
const {
  directoryTree,
  activeTab,
  openFolders,
  handleFileDelete,
  handleDirectoryDelete,
  handleRename,
  setSocketConnected,
} = useIDE();

// Player composable
const {
  initializePlayer,
  setAudioElement,
  loadFromEvents,
  play,
  pause,
  togglePlayPause,
  seek,
  skipForward,
  skipBackward,
  isPlaying,
  isReady,
  currentTime,
  duration,
  formattedCurrentTime,
  formattedDuration,
  watchStateChanges,
} = usePlayer();

type SessionState = 'checklist' | 'starting' | 'connecting' | 'ready';
const sessionState = ref<SessionState>('checklist');

const loading = ref(true);
const isConnected = ref(false);
const socketError = ref<Error | null>(null);
const slug = route.params.slug as string;

// Fake cursor position and class
const fakeCursorPos = ref({ x: 0, y: 0 });
const fakeCursorClass = ref(''); // Can be 'pointer', 'active', 'grab', etc.

// Handle seek from header
const handleSeek = async (time: number) => {
  await seek(time);
};

// Initialize the course and workspace on mount
onMounted(async () => {
  // Initialize player
  initializePlayer();
  watchStateChanges();

  const index = parseInt(route.params.index as string, 10);

  // Fetch course data
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

  // Set the current item index
  currentItemIndex.value = index;

  // For cursus type, validate that the playlist item exists
  if (currentCourse.value.type === 'cursus' && !activePlaylistItem.value) {
    toast.add({
      title: 'Error',
      description: 'Lesson not found in course.',
      color: 'error'
    });
    return;
  }

  // Get the course ID based on course type
  // For 'cursus' type, get the course ID from the playlist item
  // For 'single' type, use the current course ID directly
  const lessonCourseId = currentCourse.value.type === 'cursus'
    ? activePlaylistItem.value!.course
    : currentCourse.value.id;

  // Load recording content
  try {
    const courseContent = await fetchCourseContent(lessonCourseId);

    if (courseContent) {
      console.log('[Learn] Loading recording content...');

      // Download and load timeline
      const events = await downloadTimeline(courseContent);
      await loadFromEvents(events);

      // Get audio URL and create audio element if audio exists
      const audioUrl = getAudioUrl(courseContent);
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        setAudioElement(audio);
        console.log('[Learn] Audio loaded');
      }

      toast.add({
        title: 'Recording Loaded',
        description: 'Ready to play the lesson.',
        color: 'success',
        icon: 'i-heroicons-play-circle',
      });
    } else {
      toast.add({
        title: 'No Recording Found',
        description: 'This lesson has not been recorded yet.',
        color: 'warning',
        icon: 'i-heroicons-exclamation-triangle',
      });
    }
  } catch (error: any) {
    console.error('[Learn] Failed to load recording:', error);
    toast.add({
      title: 'Load Failed',
      description: 'Failed to load the recording.',
      color: 'error',
      icon: 'i-heroicons-exclamation-triangle',
    });
  }

  // Start the workspace for this specific lesson
  await startWorkspace(lessonCourseId);
});

// Start workspace and connect socket
const startWorkspace = async (courseId: string) => {
  try {
    sessionState.value = 'starting';

    const workspace = await ensureWorkspaceIsRunning(courseId);

    if (!workspace) {
      toast.add({
        title: 'Failed to Start Workspace',
        color: 'error'
      });
      sessionState.value = 'checklist';
      loading.value = false;
      return;
    }

    sessionState.value = 'connecting';
    progressMessage.value = 'Connecting to the IDE...';

    // Connect to workspace via socket
    const k8sName = `${workspace.name}`;
    const workspaceWsUrl = getSocketUrl(k8sName);

    console.log(`[Learn] Connecting to WebSocket at: ${workspaceWsUrl}`);

    // Initialize the socket connection
    socketClient.initialize(workspaceWsUrl);

    // Set up connection callback
    socketClient.connect(() => {
      console.log('[Learn] Socket connected successfully');
      isConnected.value = true;
      setSocketConnected(true);
      loading.value = false;

      // Start file watching
      setupFileWatching();

      toast.add({
        title: 'IDE Connected!',
        color: 'success'
      });
    });

    // Monitor connection errors
    socketClient.onConnectError((err: Error) => {
      console.error('[Learn] Socket connection error:', err);
      socketError.value = err;
      loading.value = false;
      toast.add({
        title: 'Connection Error',
        description: 'Failed to connect to workspace.',
        color: 'error'
      });
    });

    socketClient.onDisconnect(() => {
      console.log('[Learn] Socket disconnected');
      isConnected.value = false;
      setSocketConnected(false);
    });
  } catch (err: any) {
    console.error('[Learn] Failed to start workspace:', err);
    socketError.value = err;
    loading.value = false;
    toast.add({
      title: 'Error',
      description: 'Failed to start workspace.',
      color: 'error'
    });
  }
};

// Set up file watching similar to teach page
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

// Navigation between lessons
const navigateToPrevious = () => {
  if (currentItemIndex.value > 0 && currentCourse.value) {
    const newIndex = currentItemIndex.value - 1;
    router.push(`/learn/${currentCourse.value.slug}_${newIndex}`);
  }
};

const navigateToNext = () => {
  if (currentCourse.value && currentItemIndex.value < (currentCourse.value.items?.length || 0) - 1) {
    const newIndex = currentItemIndex.value + 1;
    router.push(`/learn/${currentCourse.value.slug}_${newIndex}`);
  }
};

// Cleanup on component unmount
onUnmounted(() => {
  // Pause player if playing
  if (isPlaying.value) {
    pause();
  }

  if (socketClient.isConnected) {
    console.log('[Learn] Disconnecting socket on unmount');
    socketClient.disconnect();
  }
});
</script>

<style scoped>
/* Prevent text selection during playback */
.playing-blocker * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>
