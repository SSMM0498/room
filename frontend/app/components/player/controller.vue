<template>
  <div
    class="player-controller"
    :class="{ 'is-visible': isVisible || isHovered }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="player-controls-wrapper">
      <!-- Play/Pause Button -->
      <UButton
        :color="isPlaying ? 'neutral' : 'primary'"
        :icon="isPlaying ? 'i-heroicons-pause-20-solid' : 'i-heroicons-play-20-solid'"
        @click="emit('togglePlayPause')"
        size="sm"
        :disabled="!isReady"
        variant="soft"
      />

      <!-- Time Display -->
      <div class="time-display">
        <span>{{ currentTime }}</span>
        <span class="separator">/</span>
        <span>{{ duration }}</span>
      </div>

      <!-- Timeline Scrubber -->
      <div class="timeline-wrapper">
        <input
          type="range"
          :min="0"
          :max="durationMs"
          :value="currentTimeMs"
          @input="handleSeek"
          class="timeline-scrubber"
          :disabled="!isReady"
        />
      </div>

      <!-- Skip Controls -->
      <div class="flex items-center gap-1">
        <UButton
          icon="i-heroicons-backward-20-solid"
          @click="emit('skipBackward')"
          size="sm"
          :disabled="!isReady"
          variant="ghost"
          color="neutral"
        />
        <UButton
          icon="i-heroicons-forward-20-solid"
          @click="emit('skipForward')"
          size="sm"
          :disabled="!isReady"
          variant="ghost"
          color="neutral"
        />
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
  currentTimeMs?: number;
  durationMs?: number;
}>();

const emit = defineEmits<{
  togglePlayPause: [];
  seek: [time: number];
  skipForward: [];
  skipBackward: [];
}>();

const isHovered = ref(false);
const isVisible = ref(false);
let hideTimer: number | null = null;

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

const handleSeek = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const time = parseInt(target.value, 10);
  emit('seek', time);
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
  bottom: 25px; /* Above the footer */
  left: 0;
  right: 0;
  z-index: 45;
  transform: translateY(100%);
  transition: transform 0.3s ease-out;
}

.player-controller.is-visible {
  transform: translateY(0);
}

.player-controls-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgb(229, 231, 235);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
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
  min-width: 120px;
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
}

.timeline-scrubber {
  width: 100%;
  height: 4px;
  background: rgb(229, 231, 235);
  border-radius: 2px;
  appearance: none;
  cursor: pointer;
  outline: none;
}

:global(.dark) .timeline-scrubber {
  background: rgb(55, 65, 81);
}

.timeline-scrubber::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgb(var(--color-primary-500));
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.timeline-scrubber::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgb(var(--color-primary-500));
  cursor: pointer;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.timeline-scrubber:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timeline-scrubber:disabled::-webkit-slider-thumb {
  cursor: not-allowed;
}

.timeline-scrubber:disabled::-moz-range-thumb {
  cursor: not-allowed;
}
</style>
