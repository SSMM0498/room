<template>
  <header
    class="fixed left-0 top-0 z-20 w-full flex items-center justify-between ui-base text-hightlighted p-2 border-gray-200 dark:border-gray-800">
    <nav class="flex px-2 p-0 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100 dark:bg-gray-800 items-center
      text-sm justify-center space-x-1">
      <NuxtLink :to="localePath('/')" class="logo -mt-1 mr-3 font-inter text-black dark:text-white ">room_</NuxtLink>
      <div v-if="pending"
        class="flex items-center gap-2 px-2 p-1 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100 dark:bg-gray-800">
        <USkeleton class="h-6 w-16" />
        <USkeleton class="h-6 w-24" />
        <USkeleton class="h-6 w-32" />
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
          <span v-else class="px-2 py-1">{{ item.label }}</span>
        </template>

        <template #separator>
          <span class="text-muted">/</span>
        </template>
      </UBreadcrumb>
    </nav>
    <nav v-if="($route.name as String).startsWith('teach')"
      class="flex px-1 p-0 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100 dark:bg-gray-800 items-center text-sm justify-center space-x-1">
      <UButton size="xs" class="mr-1" :class="recording.isRecording ? 'text-red-700' : 'text-gray-700'"
        icon="i-uim:record-audio" variant="link" @click="toggleRecording" />
      <UButton size="xs" class="mr-1 text-gray-700" icon="i-heroicons:play-circle" variant="link"
        :to="localePath(`/learn/${currentCourse?.slug}_0`)" />
    </nav>
    <div>
      <UButton id="btn-run-code" size="xs" class="mr-1" icon="i-heroicons:play" variant="solid" @click="runProject">
        {{ $t('ide.run') }}
      </UButton>
      <UButton id="btn-show-browser" size="xs" class="mr-1" @click="startPreview" icon="i-heroicons:globe-alt"
        variant="soft">
        {{ $t('ide.preview') }}
      </UButton>
      <UButton id="btn-show-console" size="xs" class="mr-1" icon="i-ph-terminal-window-duotone" @click="toggleTerminal"
        variant="soft">
        {{ $t('ide.terminal') }}
      </UButton>
      <UButton id="btn-search" size="xs" class="mr-1" icon="i-heroicons:magnifying-glass-solid" variant="soft" disabled>
        {{ $t('search') }}
      </UButton>
      <UButton id="btn-invite" size="xs" class="mr-1" label="Invite" icon="i-heroicons:user-plus" variant="soft"
        disabled>
        {{ $t('ide.invite') }}
      </UButton>
      <layout-color-switch />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BreadcrumbItem } from '#ui/types';

const { currentCourse, currentItemIndex, activePlaylistItem, pending } = useCourses();
const route = useRoute();

const localePath = useLocalePath();

interface CustomBreadcrumbItem extends BreadcrumbItem {
  isPopover?: boolean;
}

const breadcrumbItems = computed<CustomBreadcrumbItem[]>(() => {
  const baseItems: CustomBreadcrumbItem[] = [];

  if (!currentCourse.value || !currentCourse.value.author) {
    return baseItems;
  }

  const author = currentCourse.value.author;
  const course = currentCourse.value;

  const items: CustomBreadcrumbItem[] = [
    ...baseItems,
    {
      label: `@${author.username}`,
      to: localePath(`/@/${author.username}`),
    },
    {
      label: course.title,
      to: localePath(`/learn/${course.slug}_0`),
    },
  ];

  // Only add playlist item for cursus type courses
  if (course.type === 'cursus') {
    if (activePlaylistItem.value) {
      const item = activePlaylistItem.value;
      items.push({
        label: `${item.order + 1} - ${item.expand?.course?.title}`,
        isPopover: true,
      });
    }
  }

  return items;
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
  changeURL,
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

const startPreview = (event: MouseEvent) => {
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

const toggleTerminal = () => {
  showTerminal.value = !showTerminal.value;
}

const toggleRecording = () => {
  if (recording.isRecording.value) {
    recording.stopRecording()
  } else {
    recording.startRecording()
  }
}
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
