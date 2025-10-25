<template>
  <div class="flex flex-col w-full h-full items-start justify-start overflow-hidden">
    <nav class="flex items-center flex-nowrap w-full rounded-t-lg p-1 border-b border-gray-200 dark:border-gray-800 text-sm justify-start gap-1">
      <UIcon name="i-ph-terminal-window-duotone" />
      <div v-for="terminalId in terminals" :key="terminalId"
        class="ml-1 px-2 py-1 text-xs rounded cursor-pointer flex items-center justify-center"
        :class="{ 'bg-gray-200 dark:bg-gray-700': activeTerminal === terminalId }"
        @click="setActiveTerminal(terminalId)">
        <span>Terminal {{ terminalId.slice(0, 4) }}</span>
        <UButton @click.stop="closeTerminal(terminalId)" icon="i-heroicons:x-mark-20-solid" size="xs" variant="ghost"
          :padded="false" :square="true" color="neutral">
        </UButton>
      </div>
      <UButton icon="i-heroicons:plus-20-solid" size="xs" variant="soft" color="primary" @click="createTerminal">
      </UButton>
    </nav>
    <div class="flex-1 relative w-full h-full overflow-hidden">
      <ide-terminal v-for="terminalId in terminals" :key="terminalId" :terminal-id="terminalId"
        v-show="activeTerminal === terminalId" class="absolute inset-0 overflow-hidden" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { socketClient } = useSocket();
const { activeTerminal, setActiveTerminal } = useIDE();  // Add this line
const terminals = ref<string[]>([]);

const createTerminal = () => {
  const id = generateUUID();
  terminals.value.push(id);
  socketClient.createTerminal(id);
  setActiveTerminal(id);
};

const generateUUID = () => {
  return Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
};

const closeTerminal = (id: string) => {
  const index = terminals.value.indexOf(id);
  terminals.value = terminals.value.filter(t => t !== id);
  socketClient.closeTerminal(id);

  if (activeTerminal.value === id) {
    const terminal = terminals.value[Math.max(0, index - 1)]
    if (terminal) setActiveTerminal(terminal);
  }
};
</script>
