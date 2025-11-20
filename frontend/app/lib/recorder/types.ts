/**
 * Recorder Type Definitions
 */

import type { UIState } from '~/types/events';

export interface RecorderConfig {
  fullSnapshotInterval?: number; // (default: 15000ms = 15s)
  deltaSnapshotInterval?: number; // (default: 1500ms = 1.5s)
  version?: number;
}

export interface UIStateTracker {
  getUIState(): UIState;
}

export interface RecorderStatus {
  isRecording: boolean;
  startTime: number;
  duration: number;
  eventCount: number;
}
