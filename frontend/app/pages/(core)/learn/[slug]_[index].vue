<template>
  <div class="flex flex-col w-full h-full">
    <!-- Course Progress Header - only show for cursus type with playlist items -->
    <div v-if="currentCourse && currentCourse.type === 'cursus' && activePlaylistItem" class="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ currentCourse.title }}
          </h2>
          <p class="text-xs text-gray-600 dark:text-gray-400">
            Lesson {{ currentItemIndex + 1 }} of {{ currentCourse.items?.length || 0 }}: {{ activePlaylistItem.expand?.course?.title }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            v-if="currentItemIndex > 0"
            size="sm"
            color="neutral"
            variant="soft"
            @click="navigateToPrevious"
          >
            Previous
          </UButton>
          <UButton
            v-if="currentItemIndex < (currentCourse.items?.length || 0) - 1"
            size="sm"
            color="primary"
            @click="navigateToNext"
          >
            Next Lesson
          </UButton>
        </div>
      </div>
    </div>

    <!-- IDE Wrapper -->
    <div class="flex-1 flex w-full h-full overflow-hidden">
      <ide-wrap :loading="loading" />
    </div>
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
const { ensureWorkspaceIsRunning } = useWorkspace();
const {
  directoryTree,
  activeTab,
  openFolders,
  handleFileDelete,
  handleDirectoryDelete,
  handleRename,
} = useIDE();

const loading = ref(true);
const isConnected = ref(false);
const socketError = ref<Error | null>(null);
const slug = route.params.slug as string;

// Initialize the course and workspace on mount
onMounted(async () => {
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

  // Start the workspace for this specific lesson
  await startWorkspace(lessonCourseId);
});

// Start workspace and connect socket
const startWorkspace = async (courseId: string) => {
  try {
    const workspace = await ensureWorkspaceIsRunning(courseId);

    if (!workspace) {
      toast.add({
        title: 'Failed to Start Workspace',
        color: 'error'
      });
      loading.value = false;
      return;
    }

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
  if (socketClient.isConnected) {
    console.log('[Learn] Disconnecting socket on unmount');
    socketClient.disconnect();
  }
});
</script>
