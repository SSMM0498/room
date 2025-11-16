/**
 * Recorder Type Definitions
 */

import type { UIState, WorkspaceState } from '~/types/events';

export interface RecorderConfig {
  /** Interval for full snapshots in milliseconds (default: 15000ms = 15s) */
  fullSnapshotInterval?: number;
  /** Interval for delta snapshots in milliseconds (default: 1500ms = 1.5s) */
  deltaSnapshotInterval?: number;
  /** Version number for the recording format */
  version?: number;
}

export interface IDEStateCapture {
  getUIState(): UIState;
  getWorkspaceState(): WorkspaceState;
}

export interface RecorderStatus {
  isRecording: boolean;
  startTime: number;
  duration: number;
  eventCount: number;
}
