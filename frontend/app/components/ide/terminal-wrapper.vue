<template>
  <div class="flex flex-col w-full h-full items-start justify-start overflow-hidden">
    <nav class="flex items-center flex-nowrap w-full rounded-t-lg p-1 border-b border-gray-200 dark:border-gray-800 text-sm justify-start gap-1">
      <UIcon name="i-ph-terminal-window-duotone" class="size-4" />
      <h5>Terminal</h5>
      <div v-for="terminalId in terminals" :key="terminalId"
        class="ml-1 space-x-1 px-2 py-1 text-xs rounded cursor-pointer flex items-center justify-center"
        :class="{ 'bg-gray-200 dark:bg-gray-700': activeTerminal === terminalId }"
        @click="setActiveTerminal(terminalId)">
        <span>Terminal {{ terminalId.slice(0, 4) }}</span>
        <UButton @click.stop="closeTerminal(terminalId)" icon="i-heroicons:x-mark-20-solid" size="xs" variant="link"
          class="cursor-pointer hover:text-red-500 p-0" color="neutral">
        </UButton>
      </div>
      <UButton icon="i-heroicons:plus-20-solid" size="xs" variant="soft" color="primary" @click="(ev: MouseEvent) => createTerminal()">
      </UButton>
    </nav>
    <div class="flex-1 relative w-full h-full overflow-hidden">
      <ide-terminal v-for="terminalId in terminals" :key="terminalId" :terminal-id="terminalId"
        v-show="activeTerminal === terminalId" class="absolute inset-0 overflow-hidden" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { activeTerminal, setActiveTerminal } = useIDE();
const { terminals, createTerminal, closeTerminal } = useTerminals();
</script>
