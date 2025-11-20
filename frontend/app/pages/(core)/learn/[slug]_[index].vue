<template>

  <Head>
    <Title>{{ currentCourse?.title ?? 'Loading' }}</Title>
  </Head>

  <div class="flex flex-col w-full h-full relative">
    <!-- Center Play/Pause Icon Overlay -->
    <div v-if="centerIcon.visible" class="center-icon-overlay" :class="{ 'fade-out': centerIcon.fadingOut }">
      <div class="center-icon border-5 bg-white dark:bg-gray-950" :class="{
        'border-gray-950 dark:border-white text-gray-950 dark:text-white': isPlaying,
        'border-primary text-primary': !isPlaying
      }">
        <UIcon :name="centerIcon.icon" class="icon" />
      </div>
    </div>

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
      <ide-wrap :loading="loading" @editor-mounted="handleEditorMounted" />

      <!-- Playing Blocker Overlay -->
      <div v-show="!isPaused"
        class="playing-blocker absolute bg-transparent w-screen h-screen inset-0 z-40 cursor-normal"
        @click.prevent="handleTogglePlayPause" @mousedown.prevent @mouseup.prevent @keydown.prevent></div>
    </div>

    <!-- Player Controller (auto-hide at bottom) -->
    <player-controller v-model:current-time-ms="currentTime" :is-playing="isPlaying" :is-ready="isReady"
      :current-time="formattedCurrentTime" :duration="formattedDuration" :duration-ms="duration" :volume="volume"
      :is-muted="isMuted" :notes="notes" @toggle-play-pause="handleTogglePlayPause" @seek="handleSeek"
      @skip-forward="skipForward" @skip-backward="skipBackward" @volume-change="setVolume" @toggle-mute="toggleMute"
      @note-click="loadNote" />
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
  setSocketClient,
  loadFromEvents,
  pause,
  togglePlayPause,
  seek,
  skipForward,
  skipBackward,
  isPaused,
  isPlaying,
  isReady,
  currentTime,
  duration,
  formattedCurrentTime,
  formattedDuration,
  watchStateChanges,
  volume,
  isMuted,
  setVolume,
  toggleMute,
  notes,
  loadNote,
  player
} = usePlayer();

type SessionState = 'checklist' | 'starting' | 'connecting' | 'ready';
const sessionState = ref<SessionState>('checklist');

const loading = ref(false);
const isConnected = ref(false);
const socketError = ref<Error | null>(null);
const slug = route.params.slug as string;
const workspaceUrl = ref<string>('');
const workspaceInitialized = ref(false);
const lessonCourseId = ref<string>('');

// Center icon overlay state
const centerIcon = reactive({
  visible: false,
  fadingOut: false,
  icon: 'i-heroicons-play-20-solid'
});
let centerIconTimer: number | null = null;

// Show center icon with animation
const showCenterIcon = (icon: string) => {
  centerIcon.icon = icon;
  centerIcon.visible = true;
  centerIcon.fadingOut = false;

  if (centerIconTimer !== null) {
    clearTimeout(centerIconTimer);
  }

  centerIconTimer = window.setTimeout(() => {
    centerIcon.fadingOut = true;
    centerIconTimer = window.setTimeout(() => {
      centerIcon.visible = false;
    }, 300);
  }, 500);
};

// Handle toggle play/pause with center icon
const handleTogglePlayPause = () => {
  if (!isReady.value) return;

  // Show icon based on current state (will toggle, so show opposite)
  const icon = isPlaying.value
    ? 'i-heroicons-play-20-solid'
    : 'i-heroicons-pause-20-solid';

  showCenterIcon(icon);
  togglePlayPause();
};

// Handle editor mounted event and set up ALL playback
const handleEditorMounted = (editor: any) => {
  console.log('[Learn] Editor mounted, setting up all playback handlers');

  // ========== PLAYBACK: Register scroll callback ==========
  player.value?.getEditorScrollPlayer().setOnScroll((filePath: string, top: number, left: number) => {
    editor.setScrollTop(top);
    if (left !== undefined && left !== 0) {
      editor.setScrollLeft(left);
    }
  });

  // ========== PLAYBACK: Typing playback ==========
  player.value?.getEditorInputPlayer().setOnType((filePath: string, chunk: string) => {
    const model = editor.getModel();
    if (model) {
      const position = editor.getPosition();
      if (position) {
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        };
        model.pushEditOperations(
          [],
          [{ range, text: chunk }],
          () => null
        );
        console.log(`[Learn] Playing typing: ${filePath} (${chunk.length} chars)`);
      }
    }
  });

  // ========== PLAYBACK: Paste playback ==========
  player.value?.getEditorInputPlayer().setOnPaste((filePath: string, content: string, position?: [number, number]) => {

    const model = editor.getModel();
    if (model) {
      let line: number;
      let column: number;

      if (position) {
        line = position[0];
        column = position[1];
      } else {
        const pos = editor.getPosition();
        if (!pos) return; // No position available
        line = pos.lineNumber;
        column = pos.column;
      }

      const range = {
        startLineNumber: line,
        startColumn: column,
        endLineNumber: line,
        endColumn: column,
      };
      model.pushEditOperations(
        [],
        [{ range, text: content }],
        () => null
      );
      console.log(`[Learn] Playing paste: ${filePath} (${content.length} chars)`);
    }
  });

  // ========== PLAYBACK: Selection playback ==========
  player.value?.getEditorInputPlayer().setOnSelect((filePath: string, start: [number, number], end: [number, number]) => {

    const selection = {
      startLineNumber: start[0],
      startColumn: start[1],
      endLineNumber: end[0],
      endColumn: end[1],
    };
    editor.setSelection(selection);
    console.log(`[Learn] Playing selection: ${filePath} [${start.join(',')}] to [${end.join(',')}]`);
  });
};

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
  lessonCourseId.value = currentCourse.value.type === 'cursus'
    ? activePlaylistItem.value!.course
    : currentCourse.value.id;

  // Load recording content
  try {
    const courseContent = await fetchCourseContent(lessonCourseId.value);

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
        description: 'Ready to play the lesson. Workspace will start when you pause.',
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
});

// Start workspace (called on first pause)
const startWorkspace = async (courseId: string) => {
  try {
    loading.value = true;
    sessionState.value = 'starting';

    toast.add({
      title: 'Starting Workspace',
      description: 'Initializing your development environment...',
      color: 'primary',
      icon: 'i-heroicons-cog-6-tooth',
      duration: 3000
    });

    const workspace = await ensureWorkspaceIsRunning(courseId);

    if (!workspace) {
      toast.add({
        title: 'Failed to Start Workspace',
        color: 'error'
      });
      sessionState.value = 'checklist';
      loading.value = false;
      return false;
    }

    // Store workspace URL for socket connection
    const k8sName = `${workspace.name}`;
    workspaceUrl.value = getSocketUrl(k8sName);

    console.log('[Learn] Workspace started:', workspace.name);
    loading.value = false;
    return true;
  } catch (err: any) {
    console.error('[Learn] Failed to start workspace:', err);
    socketError.value = err;
    loading.value = false;
    toast.add({
      title: 'Error',
      description: 'Failed to start workspace.',
      color: 'error'
    });
    return false;
  }
};

// Connect to workspace socket
const connectSocket = async () => {
  if (!workspaceUrl.value) {
    console.error('[Learn] Cannot connect socket: no workspace URL');
    return;
  }

  console.log(`[Learn] Connecting to WebSocket at: ${workspaceUrl.value}`);
  sessionState.value = 'connecting';
  progressMessage.value = 'Connecting to the IDE...';

  // Initialize the socket connection
  socketClient.initialize(workspaceUrl.value);

  // Set up connection callback
  socketClient.connect(() => {
    console.log('[Learn] Socket connected successfully');
    isConnected.value = true;
    setSocketConnected(true);
    loading.value = false;
    sessionState.value = 'ready';

    // Set socket client for player Git operations
    setSocketClient(socketClient);

    // Initialize playback mode
    socketClient.init('PLAYBACK');

    // Start file watching
    setupFileWatching();

    // Checkout workspace to match recording state at current timestamp
    // This must happen after hydration completes, so we wait a moment
    setTimeout(async () => {
      await player.value?.checkoutWorkspaceAtCurrentTime();
    }, 500);

    toast.add({
      title: 'IDE Connected!',
      description: 'You can now interact with the workspace.',
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

    // Clear socket client from player
    setSocketClient(null);
  });
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

// Watch player state and manage socket connection
// Flow:
// - On pause: Connect socket → Checkout workspace to current timestamp
// - On resume: Player saves branch FIRST (while socket still connected) →
//              THEN state changes to 'playing' → Socket disconnects here
// - First pause: Start workspace, then connect socket
watch(isPlaying, async (playing) => {
  console.log('[Learn] isPlaying changed:', playing, 'isReady:', isReady.value, 'workspaceInitialized:', workspaceInitialized.value);

  if (playing) {
    // Disconnect socket during playback - we're using recorded events
    // Note: This happens AFTER Player.play() completes save-branch operation
    if (socketClient.isConnected) {
      console.log('[Learn] Disconnecting socket during playback (after save-branch)');
      socketClient.disconnect();
      isConnected.value = false;
      setSocketConnected(false);
      // Socket client will be cleared by onDisconnect handler
    }
  } else if (isReady.value) {
    // Paused - need workspace for interaction
    if (!workspaceInitialized.value && lessonCourseId.value) {
      // First pause - start workspace then connect socket
      console.log('[Learn] First pause - starting workspace');
      workspaceInitialized.value = true;

      const workspaceStarted = await startWorkspace(lessonCourseId.value);
      if (workspaceStarted) {
        // Workspace is ready, now connect socket
        await connectSocket();
      }
    } else if (workspaceUrl.value && !socketClient.isConnected) {
      // Subsequent pause - just reconnect socket
      console.log('[Learn] Subsequent pause - reconnecting socket');
      await connectSocket();
    }
  }
});

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

  // Clean up center icon timer
  if (centerIconTimer !== null) {
    clearTimeout(centerIconTimer);
  }

  // Clear socket client from player
  setSocketClient(null);

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

/* Center Play/Pause Icon Overlay */
.center-icon-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
  pointer-events: none;
  transition: opacity 0.3s ease-out;
  opacity: 1;
}

.center-icon-overlay.fade-out {
  opacity: 0;
}

.center-icon {
  border-radius: 50%;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

:global(.dark) .center-icon {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
}

.center-icon .icon {
  width: 4rem;
  height: 4rem;
}

:global(.dark) .center-icon .icon {
  color: white;
}
</style>
