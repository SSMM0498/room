import { ref } from 'vue';
import { useSocket } from './useSocket';
import { useIDE } from './useIDE';

const { socketClient } = useSocket();
const terminals = ref<string[]>([]);

export const useTerminals = () => {
  const { setActiveTerminal, showTerminal } = useIDE();

  const generateUUID = () => {
    return Math.random().toString(36).substring(2, 6) + Math.random().toString(36).substring(2, 6);
  };

  const createTerminal = () => {
    const id = generateUUID();
    terminals.value.push(id);
    socketClient.createTerminal(id);
    setActiveTerminal(id);
  };

  const addTerminal = (id: string) => {
    if (!terminals.value.includes(id)) {
      terminals.value.push(id);
    }
    setActiveTerminal(id);
    // Show terminal panel when a new terminal is added
    showTerminal.value = true;
  };

  const closeTerminal = (id: string) => {
    const index = terminals.value.indexOf(id);
    terminals.value = terminals.value.filter(t => t !== id);
    socketClient.closeTerminal(id);

    // Set active terminal to the previous one if the closed terminal was active
    const { activeTerminal } = useIDE();
    if (activeTerminal.value === id) {
      const terminal = terminals.value[Math.max(0, index - 1)];
      if (terminal) setActiveTerminal(terminal);
    }
  };

  return {
    terminals,
    createTerminal,
    addTerminal,
    closeTerminal,
  };
};
