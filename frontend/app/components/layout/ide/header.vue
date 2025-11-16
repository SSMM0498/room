<template>
  <header class="fixed left-0 top-0 z-20 w-full flex items-center justify-between ui-base text-hightlighted p-2">
    <nav class="flex px-2 p-0 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100 dark:bg-gray-800 items-center
      text-sm justify-center space-x-1">
      <NuxtLink :to="localePath('/')" class="logo -mt-1 mr-3 font-inter text-black dark:text-white ">room_</NuxtLink>
      <div v-if="pending"
        class="flex items-center gap-2 px-2 p-1 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100 dark:bg-gray-800">
        <USkeleton class="h-2 w-16" />
        <USkeleton class="h-2 w-24" />
        <USkeleton class="h-2 w-32" />
      </div>
      <UBreadcrumb v-else-if="currentCourse" :items="breadcrumbItems">
        <template #item="{ item }">
          <UPopover v-if="item.isPopover" mode="hover">
            <span
              class="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md cursor-pointer font-semibold text-primary-500 dark:text-primary-400">
              {{ item.label }}
            </span>
            <template #content>
              <div class="p-2 w-72">
                <p v-if="!currentCourse.items || currentCourse.items.length === 0" class="text-xs text-gray-500 p-2">
                  No items in this playlist.
                </p>
                <ol v-else class="flex flex-col gap-1 w-full items-start justify-start">
                  <li v-for="(playlistItem, idx) in currentCourse.items" :key="playlistItem.id"
                    class="block w-full rounded-md"
                    :class="{ 'bg-gray-100 dark:bg-gray-800': idx === currentItemIndex }">
                    <!-- Use a button to change state, not a link -->
                    <button @click="() => handleItemSelect(playlistItem.order, currentCourse!.slug)"
                      class="text-left text-sm py-1.5 px-2 w-full flex justify-between items-center cursor-pointer">
                      <span class="truncate">{{ playlistItem.order + 1 }} - {{ playlistItem.expand?.course?.title
                      }}</span>
                    </button>
                  </li>
                </ol>
              </div>
            </template>
          </UPopover>
          <span v-else class="px-1">{{ item.label }}</span>
        </template>

        <template #separator>
          <span class="text-muted">/</span>
        </template>
      </UBreadcrumb>
    </nav>
    <nav v-if="($route.name as String).startsWith('teach')"
      class="flex px-2 p-0 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100 dark:bg-gray-800 items-center text-sm justify-center gap-2">
      <!-- Recording Timer -->
      <div v-if="recording.isRecording.value" class="flex items-center gap-1.5">
        <div class="w-2 h-2 bg-red-500 rounded-full" :class="{ 'animate-pulse': !recording.isPaused.value }"></div>
        <span class="font-mono text-xs text-gray-700 dark:text-gray-300">{{ formattedRecordingTime }}</span>
      </div>

      <!-- Pause/Resume Button (only visible when recording) -->
      <UButton v-if="recording.isRecording.value" size="xs" color="neutral"
        :icon="recording.isPaused.value ? 'i-heroicons-play-20-solid' : 'i-heroicons-pause-20-solid'" variant="link"
        class="cursor-pointer" @click="togglePause">
        {{ recording.isPaused.value ? 'Resume' : 'Pause' }}
      </UButton>

      <!-- Recording Button -->
      <UButton size="xs" :color="recording.isRecording.value ? 'error' : 'neutral'"
        :icon="recording.isRecording.value ? 'i-heroicons-stop-20-solid' : 'i-uim:record-audio'" variant="link"
        class="cursor-pointer" @click="toggleRecording"
        :loading="recording.isWaitingForInitialCommit.value">
        {{ recording.isRecording.value ? 'Stop' : (recording.isWaitingForInitialCommit.value ? 'Initializing...' : 'Record') }}
      </UButton>

      <!-- Go to Player -->
      <UButton size="xs" class="text-gray-700" icon="i-heroicons:play-circle" variant="link"
        :to="localePath(`/learn/${currentCourse?.slug}_0`)" />
    </nav>
    <div class="flex items-center justify-center">
      <div class="relative">
        <div v-if="($route.name as String).startsWith('learn')"
          class="playing-blocker absolute bg-transparent w-full h-full inset-0 z-40 cursor-normal"></div>
        <UButton id="btn-run-code" size="xs" class="mr-1" icon="i-heroicons:play" variant="solid" @click="runProject">
          {{ $t('ide.run') }}
        </UButton>
        <UButton id="btn-show-browser" size="xs" class="mr-1" @click="startPreview" icon="i-heroicons:globe-alt"
          variant="soft">
          {{ $t('ide.preview') }}
        </UButton>
        <UButton id="btn-show-console" size="xs" class="mr-1" icon="i-ph-terminal-window-duotone"
          @click="toggleTerminal" variant="soft">
          {{ $t('ide.terminal') }}
        </UButton>
        <UButton id="btn-search" size="xs" class="mr-1" icon="i-heroicons:magnifying-glass-solid" variant="soft"
          disabled>
          {{ $t('search') }}
        </UButton>
        <UButton id="btn-invite" size="xs" class="mr-1" label="Invite" icon="i-heroicons:user-plus" variant="soft"
          disabled>
          {{ $t('ide.invite') }}
        </UButton>
      </div>
      <layout-color-switch />
    </div>
  </header>
</template>

<script setup lang="ts">
import type { BreadcrumbItem } from '#ui/types';

const { currentCourse, currentItemIndex, activePlaylistItem, pending } = useCourses();
const route = useRoute();

const localePath = useLocalePath();

interface CustomBreadcrumbItem extends BreadcrumbItem {
  isPopover?: boolean;
}

const breadcrumbItems = ref<CustomBreadcrumbItem[]>([]);

const initBreadcrumb = () => {
  if (!currentCourse.value || !currentCourse.value.author) {
    breadcrumbItems.value = [];
    return;
  }

  const author = currentCourse.value.author;
  const course = currentCourse.value;

  const items: CustomBreadcrumbItem[] = [
    {
      label: `@${author.username}`,
      to: localePath(`/@/${author.username}`),
    },
    {
      label: course.title,
    },
  ];

  // Add playlist item for cursus type courses
  if (course.type === 'cursus' && activePlaylistItem.value) {
    const item = activePlaylistItem.value;
    items.push({
      label: `${item.order + 1} - ${item.expand?.course?.title}`,
      isPopover: true,
    });
  }
  breadcrumbItems.value = items;
};

// Initialize breadcrumb when currentCourse changes
watch(currentCourse, (newVal) => {
  initBreadcrumb();
}, { immediate: true, deep: true });

// Update breadcrumb when activePlaylistItem changes (for cursus navigation)
watch(activePlaylistItem, (newVal) => {
  if (currentCourse.value?.type === 'cursus') {
    initBreadcrumb();
  }
});

watchEffect(() => {
  currentItemIndex.value = parseInt(route.params.index as string) || 0;
})

function handleItemSelect(index: number, slug?: string) {
  if (slug) {
    navigateTo(localePath(`/learn/${slug}_${index}`), { replace: true });
  }
}

const {
  showTerminal,
  openTabs,
  activeTab,
} = useIDE();

const { socketClient } = useSocket();
const { addTerminal } = useTerminals();

// Handle preview command results
socketClient.handlePreview((data: any) => {
  console.log('[IDE] Preview result:', data);
  if (data.error) {
    console.error('[IDE] Preview error:', data.error);
    return;
  }
  if (data.terminalId) {
    addTerminal(data.terminalId);
    console.log('[IDE] Preview terminal created:', data.terminalId);
  }
});

// Handle run command results
socketClient.handleRun((data: any) => {
  console.log('[IDE] Run result:', data);
  if (data.error) {
    console.error('[IDE] Run error:', data.error);
    return;
  }
  if (data.terminalId) {
    addTerminal(data.terminalId);
    console.log('[IDE] Run terminal created:', data.terminalId);
  }
});

const startPreview = () => {
  // Command is now configured in workspace config.toml
  socketClient.startPreview();
  console.log('[IDE] Starting preview (command from config.toml)');
};

const runProject = () => {
  // Command is now configured in workspace config.toml
  socketClient.runProject();
  console.log('[IDE] Running project (command from config.toml)');
};

const recording = useRecorder()
const { uploadRecording } = useCourseContent();

// Format recording time as MM:SS (reactive with interval)
const formattedRecordingTime = ref('00:00');
let recordingTimerInterval: number | null = null;

const updateRecordingTime = () => {
  const status = recording.getRecorderStatus();
  if (!status) {
    formattedRecordingTime.value = '00:00';
    return;
  }
  const totalSeconds = Math.floor(status.duration / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  formattedRecordingTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Track previous waiting state to detect when initialization completes
let wasWaitingForCommit = false;

// Watch for recording state changes to start/stop timer
watch(() => recording.isRecording.value, (isRecording) => {
  if (isRecording) {
    // If we were waiting for initial commit and now recording started, show success toast
    if (wasWaitingForCommit) {
      toast.add({
        title: 'Recording Started',
        description: 'Your lesson is now being recorded',
        color: 'success',
        icon: 'i-heroicons-video-camera'
      });
      wasWaitingForCommit = false;
    }

    // Start updating timer every second
    updateRecordingTime();
    recordingTimerInterval = setInterval(updateRecordingTime, 1000) as unknown as number;
  } else {
    // Stop timer when recording stops
    if (recordingTimerInterval !== null) {
      clearInterval(recordingTimerInterval);
      recordingTimerInterval = null;
    }
    formattedRecordingTime.value = '00:00';
  }
});

// Track when we enter waiting state
watch(() => recording.isWaitingForInitialCommit.value, (isWaiting) => {
  if (isWaiting) {
    wasWaitingForCommit = true;
  }
});

const toggleTerminal = () => {
  showTerminal.value = !showTerminal.value;
}

const togglePause = () => {
  if (recording.isPaused.value) {
    recording.resumeRecording();
    toast.add({
      title: 'Recording Resumed',
      description: 'Your lesson recording has resumed',
      color: 'success',
      icon: 'i-heroicons-play'
    });
  } else {
    recording.pauseRecording();
    toast.add({
      title: 'Recording Paused',
      description: 'Socket connection maintained',
      color: 'primary',
      icon: 'i-heroicons-pause'
    });
  }
};

const toast = useToast();

onMounted(() => {
  recording.setUploadCallback(async (audioBlob: Blob, timelineNDJSON: string) => {
    if (!currentCourse.value) {
      console.error('No current course available for upload');
      return false;
    }

    try {
      console.log('Starting upload process...');

      const result = await uploadRecording(
        currentCourse.value.id,
        timelineNDJSON,
        audioBlob
      );

      if (result) {
        console.log('✅ Upload completed successfully');
        return true;
      } else {
        console.error('❌ Upload failed - no result returned');
        return false;
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      return false;
    }
  });
});

const toggleRecording = async () => {
  if (recording.isRecording.value) {
    // Stop recording - upload will be triggered automatically via the callback
    recording.stopRecording();

    toast.add({
      title: 'Processing Recording',
      description: 'Saving your recording...',
      color: 'primary',
      icon: 'i-heroicons-arrow-path'
    });

  } else {
    // Check if media is ready, if not, set it up first
    if (!recording.isReady.value) {
      toast.add({
        title: 'Microphone Setup Required',
        description: 'Please allow microphone access to start recording',
        color: 'warning',
        icon: 'i-heroicons-microphone'
      });

      const success = await recording.setupMedia();
      if (!success) {
        toast.add({
          title: 'Microphone Access Denied',
          description: 'Please allow microphone access in your browser settings',
          color: 'error',
          icon: 'i-heroicons-exclamation-triangle'
        });
        return;
      }
    }

    // Request recording - will wait for initial commit if needed
    recording.requestRecording(socketClient);

    // Show appropriate toast based on state
    if (recording.isWaitingForInitialCommit.value) {
      toast.add({
        title: 'Initializing Workspace',
        description: 'Preparing workspace for recording...',
        color: 'primary',
        icon: 'i-heroicons-arrow-path'
      });
    } else {
      toast.add({
        title: 'Recording Started',
        description: 'Your lesson is now being recorded',
        color: 'success',
        icon: 'i-heroicons-video-camera'
      });
    }
  }
}

// Cleanup on component unmount
onUnmounted(() => {
  if (recordingTimerInterval !== null) {
    clearInterval(recordingTimerInterval);
    recordingTimerInterval = null;
  }
});
</script>

<style scoped lang="css">
@reference "tailwindcss";

header {
  @apply h-[40px]
}

header .logo {
  @apply relative flex justify-center items-center text-xl font-bold;
}

:deep(.ol-base) {
  @apply p-1 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100 dark:bg-gray-800;
}
</style>
