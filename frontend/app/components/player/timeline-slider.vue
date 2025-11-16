<template>
  <div ref="sliderContainer" class="timeline-slider" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave">
    <div class="timeline-track">
      <div class="timeline-progress" :style="{ width: progressPercent + '%' }"></div>

      <div v-for="note in notes" :key="note.id" class="note-marker" :style="{ left: getNotePosition(note) + '%' }"
        @click.stop="handleNoteClick(note.id)" @mouseenter="showNoteTooltip(note, $event)" @mouseleave="hideTooltip">
        <div class="note-dot"></div>
      </div>

      <div class="timeline-scrubber" :style="{ left: progressPercent + '%' }"></div>
    </div>

    <div v-if="tooltip.visible" class="timeline-tooltip" :style="{ left: tooltip.x + 'px' }">
      <div class="tooltip-time">{{ tooltip.time }}</div>
      <div v-if="tooltip.description" class="tooltip-description">
        {{ tooltip.description }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PlayerNote } from '~/types/events.ts';

const props = defineProps<{
  currentTime: number;  // Current time in ms
  duration: number;     // Total duration in ms
  notes?: PlayerNote[]; // Saved notes to display
  disabled?: boolean;   // Disable interaction
}>();

const emit = defineEmits<{
  seek: [time: number];     // User scrubbed to a time
  noteClick: [noteId: string]; // User clicked a note marker
}>();

const sliderContainer = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const tooltip = reactive({
  visible: false,
  x: 0,
  time: '0:00',
  description: ''
});

// Calculate progress percentage
const progressPercent = computed(() => {
  if (!props.duration || props.duration === 0) return 0;
  return (props.currentTime / props.duration) * 100;
});

// Calculate note position as percentage
const getNotePosition = (note: PlayerNote): number => {
  if (!props.duration || props.duration === 0) return 0;
  return (note.timestamp / props.duration) * 100;
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

// Handle mouse down to start dragging
const handleMouseDown = (e: MouseEvent) => {
  if (props.disabled) return;

  isDragging.value = true;
  seekToPosition(e);
};

// Handle mouse move while dragging or for tooltip
const handleMouseMove = (e: MouseEvent) => {
  if (!sliderContainer.value) return;

  // Update tooltip
  const rect = sliderContainer.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, x / rect.width));
  const timeMs = percentage * props.duration;

  tooltip.visible = true;
  tooltip.x = x;
  tooltip.time = formatTime(timeMs);
  tooltip.description = '';

  // If dragging, seek
  if (isDragging.value) {
    seekToPosition(e);
  }
};

// Handle mouse leave
const handleMouseLeave = () => {
  hideTooltip();
};

// Seek to position based on mouse event
const seekToPosition = (e: MouseEvent) => {
  if (!sliderContainer.value || props.disabled) return;

  const rect = sliderContainer.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, x / rect.width));
  const timeMs = percentage * props.duration;

  emit('seek', timeMs);
};

// Handle note marker click
const handleNoteClick = (noteId: string) => {
  if (props.disabled) return;
  emit('noteClick', noteId);
};

// Show tooltip for note
const showNoteTooltip = (note: PlayerNote, e: MouseEvent) => {
  if (!sliderContainer.value) return;

  const rect = sliderContainer.value.getBoundingClientRect();
  const x = e.clientX - rect.left;

  tooltip.visible = true;
  tooltip.x = x;
  tooltip.time = formatTime(note.timestamp);
  tooltip.description = note.description || 'Interactive note';
};

// Hide tooltip
const hideTooltip = () => {
  tooltip.visible = false;
};

// Global mouse up handler
const handleGlobalMouseUp = () => {
  isDragging.value = false;
};

onMounted(() => {
  window.addEventListener('mouseup', handleGlobalMouseUp);
});

onUnmounted(() => {
  window.removeEventListener('mouseup', handleGlobalMouseUp);
});
</script>

<style scoped>
.timeline-slider {
  position: relative;
  width: 100%;
  /* padding: 8px 0; */
  cursor: pointer;
}

.timeline-track {
  position: relative;
  width: 100%;
  height: 2.5px;
  background: rgb(229, 231, 235);
  border-radius: 3px;
  overflow: visible;
  display: flex;
  align-items: center;
  justify-content: start;
}

:global(.dark) .timeline-track {
  background: rgb(55, 65, 81);
}

.timeline-progress {
  position: absolute;
  left: 0;
  height: 100%;
  background: rgb(59, 130, 246);
  border-radius: 3px;
  transition: width 0.1s linear;
  pointer-events: none;
}

:global(.dark) .timeline-progress {
  background: rgb(96, 165, 250);
}

.timeline-scrubber {
  position: absolute;
  transform: translate(-50%, 0);
  width: 10px;
  height: 10px;
  background: white;
  border: 1px solid rgb(59, 130, 246);
  border-radius: 50%;
  cursor: grab;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

:global(.dark) .timeline-scrubber {
  background: rgb(17, 24, 39);
  border-color: rgb(96, 165, 250);
}

.timeline-slider:active .timeline-scrubber {
  cursor: grabbing;
}

.note-marker {
  position: absolute;
  z-index: 3;
  cursor: pointer;
}

.note-dot {
  width: 7px;
  height: 7px;
  background: rgb(234, 8, 8);
  border: 1px solid white;
  border-radius: 50%;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

:global(.dark) .note-dot {
  background: rgb(250, 204, 21);
  border-color: rgb(17, 24, 39);
}

.note-marker:hover .note-dot {
  transform: scale(1.3);
}

.timeline-tooltip {
  position: absolute;
  bottom: 50%;
  margin-bottom: 12px;
  padding: 6px 10px;
  background: white;
  border: 1px solid rgb(229, 231, 235);
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  pointer-events: none;
  z-index: 50;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

:global(.dark) .timeline-tooltip {
  background: rgb(31, 41, 55);
  border-color: rgb(75, 85, 99);
  color: rgb(229, 231, 235);
}

.tooltip-time {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 600;
  color: rgb(17, 24, 39);
}

:global(.dark) .tooltip-time {
  color: rgb(229, 231, 235);
}

.tooltip-description {
  margin-top: 2px;
  font-size: 0.7rem;
  color: rgb(107, 114, 128);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.dark) .tooltip-description {
  color: rgb(156, 163, 175);
}
</style>
