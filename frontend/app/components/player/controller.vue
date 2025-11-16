<template>
  <div class="player-controller border-y bg-white dark:bg-gray-950 border-accented"
    :class="{ 'is-visible': isVisible || isHovered }" @mouseenter="isHovered = true" @mouseleave="isHovered = false">
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
      <div class="timeline-wrapper">
        <player-timeline-slider :current-time="currentTimeMs" :duration="durationMs || 0" :notes="notes"
          :disabled="!isReady" @seek="handleSeek" @note-click="handleNoteClick" />
      </div>

      <!-- Skip Controls -->
      <div class="flex items-center gap-1">
        <UButton icon="i-heroicons-backward-20-solid" @click="emit('skipBackward')" size="sm" :disabled="!isReady"
          variant="ghost" color="neutral" />
        <UButton icon="i-heroicons-forward-20-solid" @click="emit('skipForward')" size="sm" :disabled="!isReady"
          variant="ghost" color="neutral" />
      </div>

      <!-- Volume Control -->
      <div class="volume-control flex items-center gap-2">
        <UButton :icon="volumeIcon" @click="emit('toggleMute')" size="sm" variant="ghost" color="neutral" />
        <div class="volume-slider-wrapper" style="width: 100px">
          <USlider :model-value="props.volume" @update:model-value="handleVolumeChange" :min="0" :max="1" :step="0.01"
            size="xs" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerNote } from '~/types/events.ts';

const props = defineProps<{
  isPlaying?: boolean;
  isReady?: boolean;
  currentTime?: string;
  duration?: string;
  durationMs?: number;
  volume?: number;
  isMuted?: boolean;
  notes?: PlayerNote[];
}>();

const currentTimeMs = defineModel<number>('currentTimeMs', { required: true });

const emit = defineEmits<{
  togglePlayPause: [];
  seek: [time: number];
  skipForward: [];
  skipBackward: [];
  volumeChange: [volume: number];
  toggleMute: [];
  noteClick: [noteId: string];
}>();

// Compute volume icon based on volume level and mute state
const volumeIcon = computed(() => {
  if (props.isMuted || props.volume === 0) {
    return 'i-heroicons-speaker-x-mark-20-solid';
  }
  if (props.volume && props.volume <= 0.5) {
    return 'i-heroicons-speaker-wave-20-solid';
  }
  return 'i-heroicons-speaker-wave-20-solid';
});

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

const handleSeek = (time: number) => {
  emit('seek', time);
};

const handleNoteClick = (noteId: string) => {
  emit('noteClick', noteId);
};

const handleVolumeChange = (value: unknown) => {
  if (typeof value === 'number') {
    emit('volumeChange', value);
  }
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
  bottom: 3%;
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

.volume-control {
  position: relative;
  display: flex;
  align-items: center;
}

.volume-slider-wrapper {
  transition: width 0.2s ease-out, opacity 0.2s ease-out;
}

@media (max-width: 640px) {
  .volume-slider-wrapper {
    display: none;
  }
}
</style>
