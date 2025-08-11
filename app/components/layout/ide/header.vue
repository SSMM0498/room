<template>
  <header class="fixed left-0 top-0 z-20 w-full flex items-center justify-between ui-base text-gray-900 p-2">
    <nav class="flex px-2 p-0 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-700 items-center
      text-sm justify-center space-x-1">
      <NuxtLink :to="localePath('/')" font-inter class="logo">room_</NuxtLink>
      <i class="icon i-ri:arrow-right-s-line"></i>
      <NuxtLink class="hover:text-blue" :to="localePath('/wall/ssmm0498')">@ssmm0498</NuxtLink>
      <i class="icon i-ri:arrow-right-s-line"></i>
      <span>Learn Golang Base</span>
      <i class="icon i-ri:arrow-right-s-line"></i>
      <UPopover mode="hover">
        <span>0 - Basics</span>

        <template #panel>
          <div class="p-2 w-48">
            <ol class="flex flex-col gap-1 w-full items-start justify-start">
              <li
                class="block py-1 px-2 dark:hover:bg-gray-100/3 hover:bg-gray-900/7 w-full dark:hover:bg-gray-700 rounded-md">
                <NuxtLink class="flex justify-between items-center w-full">
                  <span>1 - Introduction</span>
                  <span class="text-xs text-blue-500 font-semibold py-1 px-2 rounded-xl bg-gray-100/2">10:32</span>
                </NuxtLink>
              </li>
              <li
                class="block py-1 px-2 dark:hover:bg-gray-100/3 hover:bg-gray-900/7 w-full dark:hover:bg-gray-700 rounded-md">
                <NuxtLink class="flex justify-between items-center w-full">
                  <span>2 - Variables</span>
                  <span class="text-xs text-blue-500 font-semibold py-1 px-2 rounded-xl bg-gray-100/2">15:23</span>
                </NuxtLink>
              </li>
              <li
                class="block py-1 px-2 dark:hover:bg-gray-100/3 hover:bg-gray-900/7 w-full dark:hover:bg-gray-700 rounded-md">
                <NuxtLink class="flex justify-between items-center w-full">
                  <span>3 - Control Flow</span>
                  <span class="text-xs text-blue-500 font-semibold py-1 px-2 rounded-xl bg-gray-100/2">20:07</span>
                </NuxtLink>
              </li>
            </ol>
          </div>
        </template>
      </UPopover>
    </nav>
    <nav v-if="!isPlayer"
      class="flex px-1 p-0 border border-gray-300 rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-700 items-center text-sm justify-center space-x-1">
      <UButton size="xs" class="mr-1" :class="recording.isRecording ? 'text-red-700' : 'text-gray-700'"
        icon="i-uim:record-audio" variant="link" @click="toggleRecording" />
      <UButton size="xs" class="mr-1 text-gray-700" icon="i-heroicons:play-circle" variant="link"
        :to="localePath('/ide/player')" />
    </nav>
    <div>
      <UButton id="btn-run-code" size="xs" class="mr-1" label="Run" icon="i-heroicons:play" variant="solid"
        @click="runProject"></UButton>
      <UButton id="btn-show-browser" size="xs" class="mr-1" label="Preview" @click="startPreview"
        icon="i-heroicons:globe-alt" variant="soft">
      </UButton>
      <UButton id="btn-show-console" size="xs" class="mr-1" label="Terminal" icon="i-ph-terminal-window-duotone"
        @click="() => showTerminal = !showTerminal" variant="soft"></UButton>
      <UButton id="btn-search" size="xs" class="mr-1" label="Search" icon="i-heroicons:magnifying-glass-solid"
        variant="soft"></UButton>
      <UButton id="btn-invite" size="xs" class="mr-1" label="Invite" icon="i-heroicons:user-plus" variant="soft">
      </UButton>
      <layout-color-switch />
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  isPlayer: boolean
}>();

const localePath = useLocalePath();

// const {
//   showTerminal,
//   changeURL,
//   activeTerminal
// } = useEditor();

const { socketClient } = useSocket();

const startPreview = (event: MouseEvent) => {
  // if (!activeTerminal.value) return;
  // changeURL("http://localhost:1337/")
  // socketClient.startPreview(activeTerminal.value);
};

const runProject = () => {
  // if (!activeTerminal.value) return;
  // socketClient.runProject(activeTerminal.value);
};

const recording = useRecordingStore()

const toggleRecording = () => {
  // console.log("toggleRecording")
  // if (recording.isRecording) {
  //   recording.stopRecording()
  // } else {
  //   recording.startRecording()
  // }
}
</script>

<style scoped lang="css">
@reference "tailwindcss";

header {
  @apply h-[40px]
}

header .logo {
  @apply relative flex justify-center items-center text-black dark:text-white text-xl font-bold;
}
</style>
