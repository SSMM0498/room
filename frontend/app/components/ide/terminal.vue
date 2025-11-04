<template>
  <div class="flex flex-col w-full h-full px-2 py-1 overflow-hidden">
    <div ref="terminalRef" class="w-full h-full"></div>
  </div>
</template>

<script setup lang="ts">
import { WebLinksAddon } from "xterm-addon-web-links";
import type { ITheme } from 'xterm'
import { Terminal as XTerminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import themeLight from 'theme-vitesse/extra/xterm-vitesse-light.json'
import themeDark from 'theme-vitesse/extra/xterm-vitesse-dark.json'

const colorMode = useColorMode()
const theme = computed<ITheme>(() => {
  return colorMode.value === 'dark'
    ? {
      ...themeDark,
    }
    : {
      ...themeLight,
      black: "#1e1f1d",
    }
})

const fitAddon: FitAddon = new FitAddon();

const xterm: XTerminal = new XTerminal({
  convertEol: true,
  cursorBlink: true,
  customGlyphs: true,
  allowTransparency: true,
  theme: theme.value,
  fontFamily: 'DM Mono, monospace',
});
xterm.loadAddon(fitAddon);

const { isDragging } = useIDE();
const { socketClient } = useSocket();
const { recorder } = useRecorder();
const terminalRef = ref<HTMLDivElement | null>(null);

const props = defineProps<{
  terminalId: string
}>();

watch(terminalRef, () => {
  console.log("FIT")
  xterm.loadAddon(new WebLinksAddon());
  if (terminalRef.value) {
    xterm.open(terminalRef.value);
    fitAddon.fit();

    // Register the scrollable viewport element for scroll tracking
    // The .xterm-viewport element is the scrollable container in Xterm.js
    nextTick(() => {
      const viewportElement = terminalRef.value?.querySelector('.xterm-viewport') as HTMLElement;
      if (viewportElement && recorder.value) {
        recorder.value.getScrollWatcher().registerScrollable(viewportElement, 'terminal', props.terminalId);
        console.log(`[Terminal] Registered scroll watcher for terminal: ${props.terminalId}`);
      }
    });
  }
});

watch(
  () => theme.value,
  (t) => {
    xterm.options.theme = t
  },
)

watch(isDragging, () => {
  fitAddon.fit();
});

onMounted(() => {
  xterm.onData((data: string) => {
    socketClient.inputTerminal({
      id: props.terminalId,
      input: data
    });
  });
});

onUnmounted(() => {
  // Unregister the scrollable element when component unmounts
  if (terminalRef.value && recorder.value) {
    const viewportElement = terminalRef.value.querySelector('.xterm-viewport') as HTMLElement;
    if (viewportElement) {
      recorder.value.getScrollWatcher().unregisterScrollable(viewportElement);
      console.log(`[Terminal] Unregistered scroll watcher for terminal: ${props.terminalId}`);
    }
  }
});

socketClient.handleTerminalData(({ id, content }) => {
  if (id === props.terminalId) {
    xterm.write(content);
  }
});
</script>

<style lang="css">
@reference "tailwindcss";

.xterm {
  cursor: text;
  position: relative;
  user-select: none;
  -ms-user-select: none;
  -webkit-user-select: none;
}

.xterm.focus,
.xterm:focus {
  outline: none;
}

.xterm .xterm-helpers {
  position: absolute;
  top: 0;
  /**
   * The z-index of the helpers must be higher than the canvases in order for
   * IMEs to appear on top.
   */
  z-index: 5;
}

.xterm .xterm-helper-textarea {
  padding: 0;
  border: 0;
  margin: 0;
  /* Move textarea out of the screen to the far left, so that the cursor is not visible */
  position: absolute;
  opacity: 0;
  left: -9999em;
  top: 0;
  width: 0;
  height: 0;
  z-index: -5;
  /** Prevent wrapping so the IME appears against the textarea at the correct position */
  white-space: nowrap;
  overflow: hidden;
  resize: none;
}

.xterm .composition-view {
  background: transparent;
  color: #fff;
  display: none;
  position: absolute;
  white-space: nowrap;
  z-index: 1;
}

.xterm .composition-view.active {
  display: block;
}

.xterm .xterm-viewport {
  /* On OS X this is required in order for the scroll bar to appear fully opaque */
  background-color: transparent !important;
  overflow-y: scroll;
  cursor: default;
  position: absolute;
  right: 0;
  left: 0;
  top: 0;
  bottom: 0;
}

.xterm .xterm-screen {
  position: relative;
}

.xterm .xterm-screen canvas {
  position: absolute;
  left: 0;
  top: 0;
}

.xterm .xterm-scroll-area {
  visibility: hidden;
}

.xterm-char-measure-element {
  display: inline-block;
  visibility: hidden;
  position: absolute;
  top: 0;
  left: -9999em;
  line-height: normal;
}

.xterm.enable-mouse-events {
  /* When mouse events are enabled (eg. tmux), revert to the standard pointer cursor */
  cursor: default;
}

.xterm.xterm-cursor-pointer,
.xterm .xterm-cursor-pointer {
  cursor: pointer;
}

.xterm.column-select.focus {
  /* Column selection mode */
  cursor: crosshair;
}

.xterm .xterm-accessibility,
.xterm .xterm-message {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 10;
  color: transparent;
}

.xterm .live-region {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.xterm-dim {
  opacity: 0.5;
}

.xterm-underline-1 {
  text-decoration: underline;
}

.xterm-underline-2 {
  text-decoration: double underline;
}

.xterm-underline-3 {
  text-decoration: wavy underline;
}

.xterm-underline-4 {
  text-decoration: dotted underline;
}

.xterm-underline-5 {
  text-decoration: dashed underline;
}

.xterm-strikethrough {
  text-decoration: line-through;
}

.xterm-screen .xterm-decoration-container .xterm-decoration {
  z-index: 6;
  position: absolute;
}

.xterm-decoration-overview-ruler {
  z-index: 7;
  position: absolute;
  top: 0;
  right: 0;
  pointer-events: none;
}

.xterm-decoration-top {
  z-index: 2;
  position: relative;
}
</style>