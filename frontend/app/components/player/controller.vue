<template>
  <div class="player-controller border-t bg-white dark:bg-gray-950 border-accented" :class="{ 'is-visible': isVisible || isHovered }" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
    <div class="player-controls-wrapper bg-black/5 dark:bg-white/5">
      <!-- Play/Pause Button -->
      <UButton :color="isPlaying ? 'neutral' : 'primary'"
        :icon="isPlaying ? 'i-heroicons-pause-20-solid' : 'i-heroicons-play-20-solid'" @click="emit('togglePlayPause')"
        class="rounded-full cursor-pointer" size="sm" square :disabled="!isReady" variant="outline" />

      <!-- Time Display -->
      <div class="time-display">
        <span>{{ currentTime }}</span>
        <span class="separator">/</span>
        <span>{{ duration }}</span>
      </div>

      <!-- Timeline Scrubber -->
      <div class="timeline-wrapper"
        @mousemove="handleSliderMouseMove"
        @mouseleave="hideTooltip"
        ref="sliderWrapper">
        <USlider :min="0" :max="durationMs" v-model="currentTimeMs" :disabled="!isReady" @update:model-value="handleSeek" size="xs" />

        <!-- Time Tooltip -->
        <div v-if="tooltip.visible"
          class="time-tooltip border border-accented bg-white dark:bg-gray-950"
          :style="{ left: tooltip.x + 'px' }">
          {{ tooltip.time }}
        </div>
      </div>

      <!-- Skip Controls -->
      <div class="flex items-center gap-1">
        <UButton icon="i-heroicons-backward-20-solid" @click="emit('skipBackward')" size="sm" :disabled="!isReady"
          variant="ghost" color="neutral" />
        <UButton icon="i-heroicons-forward-20-solid" @click="emit('skipForward')" size="sm" :disabled="!isReady"
          variant="ghost" color="neutral" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isPlaying?: boolean;
  isReady?: boolean;
  currentTime?: string;
  duration?: string;
  durationMs?: number;
}>();

const currentTimeMs = defineModel<number>('currentTimeMs', { required: true });

const emit = defineEmits<{
  togglePlayPause: [];
  seek: [time: number];
  skipForward: [];
  skipBackward: [];
}>();

const isHovered = ref(false);
const isVisible = ref(false);
let hideTimer: number | null = null;

const sliderWrapper = ref<HTMLElement | null>(null);
const tooltip = reactive({
  visible: false,
  x: 0,
  time: '0:00'
});

// Show controller when mouse moves near bottom of screen
const handleMouseMove = (e: MouseEvent) => {
  const distanceFromBottom = window.innerHeight - e.clientY;

  if (distanceFromBottom < 100) {
    isVisible.value = true;
    // Clear any existing hide timer
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  } else {
    // Start hide timer when mouse moves away
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
    }
    hideTimer = window.setTimeout(() => {
      isVisible.value = false;
    }, 2000); // Hide after 2 seconds
  }
};

const handleSeek = (value: unknown) => {
  let time: number;
  if (Array.isArray(value)) {
    time = value[0] as number;
  } else {
    time = value as number;
  }
  emit('seek', time);
};

// Format milliseconds to time string (m:ss or h:mm:ss)
const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Handle mouse movement over the slider to show tooltip
const handleSliderMouseMove = (e: MouseEvent) => {
  if (!sliderWrapper.value || !props.durationMs || !props.isReady) return;

  const rect = sliderWrapper.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, x / rect.width));
  const timeMs = percentage * props.durationMs;

  tooltip.visible = true;
  tooltip.x = x;
  tooltip.time = formatTime(timeMs);
};

// Hide tooltip when mouse leaves the slider
const hideTooltip = () => {
  tooltip.visible = false;
};

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  if (hideTimer !== null) {
    clearTimeout(hideTimer);
  }
});
</script>

<style scoped>
.player-controller {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 45;
  transform: translateY(100%);
  opacity: 0;
  transition: transform 0.25s ease-out, opacity 0.125s ease-out;
}

.player-controller.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.player-controls-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem 1.5rem;
}

:global(.dark) .player-controls-wrapper {
  background: rgba(17, 24, 39, 0.95);
  border-top-color: rgb(55, 65, 81);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
}

.time-display {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.875rem;
  color: rgb(55, 65, 81);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 100px;
}

:global(.dark) .time-display {
  color: rgb(209, 213, 219);
}

.time-display .separator {
  color: rgb(156, 163, 175);
}

:global(.dark) .time-display .separator {
  color: rgb(75, 85, 99);
}

.timeline-wrapper {
  flex: 1;
  min-width: 200px;
  position: relative;
}

.time-tooltip {
  position: absolute;
  bottom: 100%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 4px 8px;
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: nowrap;
  pointer-events: none;
  z-index: 50;
}

:global(.dark) .time-tooltip {
  background: rgba(255, 255, 255, 0.95);
  color: rgb(17, 24, 39);
}
</style>
