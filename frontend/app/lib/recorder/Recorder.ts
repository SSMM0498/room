/**
 * Core Recorder Class
 *
 * Captures every meaningful action performed within the web-based IDE
 * and serializes them into a timestamped NDJSON Action Log.
 */

import type {
  AnyActionPacket,
  SnapshotPayload,
  MetaStartPayload,
  MetaEndPayload,
} from '~/types/events';
import { createActionPacket, EventTypes } from '~/types/events';
import { SnapshotManager } from './SnapshotManager';
import { CursorMovementWatcher } from './CursorMovementWatcher';
import { CursorInteractionWatcher } from './CursorInteractionWatcher';
import { CursorStyleWatcher } from './CursorStyleWatcher';
import { ResourceWatcher } from './ResourceWatcher';
import { CommitHashTracker } from './CommitHashTracker';
import { EditorTabWatcher } from './EditorTabWatcher';
import { EditorScrollWatcher } from './EditorScrollWatcher';
import { EditorInputWatcher } from './EditorInputWatcher';
import type { RecorderConfig, UIStateTracker, RecorderStatus } from './types';

export class Recorder {
  private eventsTimeLine: AnyActionPacket[] = [];
  private isRecording = false;
  private startTime: number = 0;

  // Interval IDs for snapshot timers
  private fullSnapshotIntervalId: number | null = null;
  private deltaSnapshotIntervalId: number | null = null;

  // Configuration
  private config: Required<RecorderConfig>;

  // Snapshot manager
  private snapshotManager: SnapshotManager;
  private uiStateTracker: UIStateTracker | null = null;
  private commitHashTracker: CommitHashTracker;

  // Event watchers
  private cursorMovementWatcher: CursorMovementWatcher;
  private cursorInteractionWatcher: CursorInteractionWatcher;
  private cursorStyleWatcher: CursorStyleWatcher;
  private ideTabWatcher: EditorTabWatcher;
  private resourceWatcher: ResourceWatcher;
  private editorScrollWatcher: EditorScrollWatcher;
  private editorInputWatcher: EditorInputWatcher;

  constructor(config: RecorderConfig = {}) {
    this.config = {
      fullSnapshotInterval: config.fullSnapshotInterval ?? 15000,
      deltaSnapshotInterval: config.deltaSnapshotInterval ?? 1500,
      version: config.version ?? 1,
    };
    this.addNewEvent = this.addNewEvent.bind(this);
    this.snapshotManager = new SnapshotManager();
    this.cursorMovementWatcher = new CursorMovementWatcher(this.addNewEvent);
    this.cursorInteractionWatcher = new CursorInteractionWatcher(this.addNewEvent);
    this.cursorStyleWatcher = new CursorStyleWatcher(this.addNewEvent);
    this.ideTabWatcher = new EditorTabWatcher(this.addNewEvent);
    this.resourceWatcher = new ResourceWatcher(this.addNewEvent);
    this.editorScrollWatcher = new EditorScrollWatcher(this.addNewEvent);
    this.editorInputWatcher = new EditorInputWatcher(this.addNewEvent);
    // CommitHashTracker triggers delta snapshots on every commit
    this.commitHashTracker = new CommitHashTracker((hash: string) => {
      this.takeDeltaSnapshot();
    });
  }

  /**
   * Sets the state capture interface that provides IDE and workspace state
   */
  setUIStateTracker(capture: UIStateTracker): void {
    this.uiStateTracker = capture;
  }

  /**
   * Get the IDE tab watcher instance for components to record tab events
   */
  getIdeTabWatcher(): EditorTabWatcher {
    return this.ideTabWatcher;
  }

  /**
   * Get the resource watcher instance for components to record file/folder events
   */
  getResourceWatcher(): ResourceWatcher {
    return this.resourceWatcher;
  }

  /**
   * Get the commit hash tracker instance for components to track Git commits
   */
  getCommitHashTracker(): CommitHashTracker {
    return this.commitHashTracker;
  }

  /**
   * Get the editor scroll watcher instance for components to record scroll events
   */
  getEditorScrollWatcher(): EditorScrollWatcher {
    return this.editorScrollWatcher;
  }

  /**
   * Get the editor input watcher instance for components to record input events
   */
  getEditorInputWatcher(): EditorInputWatcher {
    return this.editorInputWatcher;
  }

  /**
   * Starts the recording session
   */
  start(): void {
    if (this.isRecording) {
      console.warn('[Recorder] Already recording');
      return;
    }

    this.isRecording = true;
    this.startTime = Date.now();
    this.eventsTimeLine = [];
    this.snapshotManager.reset();

    // Take an immediate full snapshot to establish baseline
    const fullSnapShot = this.takeFullSnapshot();

    if (fullSnapShot) {
      // Add the meta:start event
      this.addNewEvent<MetaStartPayload>(
        'meta',
        EventTypes.META_START,
        {
          version: this.config.version,
          timestamp: this.startTime,
          initialSnapshot: fullSnapShot,
        }
      );

      // Start watchers
      this.cursorMovementWatcher.watch();
      this.cursorInteractionWatcher.watch();
      this.cursorStyleWatcher.watch();

      // Start periodic snapshot intervals
      this.startSnapshotIntervals();
      console.log('[Recorder] Recording started at', new Date(this.startTime).toISOString());
    } else {
      console.log("[Recorder] Can't create first full snapshot")
    }
  }

  /**
   * Stops the recording session
   */
  stop(): void {
    if (!this.isRecording) {
      console.warn('[Recorder] Not currently recording');
      return;
    }

    // Stop watchers
    this.cursorMovementWatcher.stop();
    this.cursorInteractionWatcher.stop();
    this.cursorStyleWatcher.stop();

    // Flush any pending editor input events
    this.editorInputWatcher.cleanup();

    // Stop snapshot intervals
    this.stopSnapshotIntervals();

    // Take a final full snapshot
    const fullSnapShot = this.takeFullSnapshot();

    if (fullSnapShot) {
      // Add the meta:end event
      const endTime = Date.now();
      this.addNewEvent<MetaEndPayload>(
        'meta',
        EventTypes.META_END,
        {
          timestamp: endTime,
          lastSnapshot: fullSnapShot,
        }
      );

      this.isRecording = false;

      console.log('[Recorder] Recording stopped. Duration:', (endTime - this.startTime) / 1000, 'seconds');
      console.log('[Recorder] Total events:', this.eventsTimeLine.length);
    }
  }

  /**
   * Adds a new event to the timeline
   */
  addNewEvent<P>(src: string, act: string, payload: P, timestamp?: number): void {
    if (!this.isRecording) {
      console.warn('[Recorder] Cannot add event: not recording');
      return;
    }

    const event = createActionPacket(src, act, payload, timestamp);
    this.eventsTimeLine.push(event as AnyActionPacket);
  }

  /**
   * Takes a full snapshot of the current IDE and workspace state
   */
  takeFullSnapshot(): SnapshotPayload | void {
    if (!this.uiStateTracker) {
      console.warn('[Recorder] Cannot take snapshot: state capture not configured');
      return;
    }

    const uiState = this.uiStateTracker.getUIState();
    const commitHash = this.commitHashTracker.getLatestCommitHash();

    const snapshotPayload = this.snapshotManager.createFullSnapshot(uiState, commitHash);

    console.log('[Recorder] Full snapshot taken at', Date.now(), 'with commit:', commitHash.substring(0, 8));

    return snapshotPayload
  }

  /**
   * Takes a delta snapshot (only changes since last snapshot)
   */
  takeDeltaSnapshot(): void {
    if (!this.uiStateTracker) {
      console.warn('[Recorder] Cannot take snapshot: state capture not configured');
      return;
    }

    const currentUIState = this.uiStateTracker.getUIState();
    const commitHash = this.commitHashTracker.getLatestCommitHash();

    const deltaPayload = this.snapshotManager.createDeltaSnapshot(
      currentUIState,
      commitHash
    );

    // Only emit delta snapshot if there are actual changes
    if (deltaPayload) {
      this.addNewEvent<SnapshotPayload>(
        'state',
        EventTypes.STATE_SNAPSHOT_DELTA,
        deltaPayload
      );

      console.log('[Recorder] Delta snapshot taken at', Date.now(), 'with commit:', commitHash.substring(0, 8));
    }
  }

  /**
   * Start the periodic snapshot intervals
   */
  private startSnapshotIntervals(): void {
    // Full snapshot interval
    this.fullSnapshotIntervalId = window.setInterval(() => {
      this.takeFullSnapshot();
    }, this.config.fullSnapshotInterval);

    // Delta snapshot interval
    this.deltaSnapshotIntervalId = window.setInterval(() => {
      this.takeDeltaSnapshot();
    }, this.config.deltaSnapshotInterval);
  }

  /**
   * Stop the periodic snapshot intervals
   */
  private stopSnapshotIntervals(): void {
    if (this.fullSnapshotIntervalId !== null) {
      clearInterval(this.fullSnapshotIntervalId);
      this.fullSnapshotIntervalId = null;
    }

    if (this.deltaSnapshotIntervalId !== null) {
      clearInterval(this.deltaSnapshotIntervalId);
      this.deltaSnapshotIntervalId = null;
    }
  }

  /**
   * Get the current timeline of events
   */
  getTimeline(): AnyActionPacket[] {
    return [...this.eventsTimeLine];
  }

  /**
   * Export the timeline as NDJSON string
   */
  exportAsNDJSON(): string {
    // TODO: Compress the file on backend side to reduce the size
    return this.eventsTimeLine.map(event => JSON.stringify(event)).join('\n');
  }

  /**
   * Get the recording duration in milliseconds
   */
  getDuration(): number {
    if (!this.isRecording && this.eventsTimeLine.length === 0) {
      return 0;
    }
    const currentTime = this.isRecording ? Date.now() : this.eventsTimeLine[this.eventsTimeLine.length - 1]?.t ?? 0;
    return currentTime - this.startTime;
  }

  /**
   * Get the current recording status
   */
  getStatus(): RecorderStatus {
    return {
      isRecording: this.isRecording,
      startTime: this.startTime,
      duration: this.getDuration(),
      eventCount: this.eventsTimeLine.length,
    };
  }

  /**
   * Clean up resources and stop recording
   */
  destroy(): void {
    if (this.isRecording) {
      this.stop();
    }
    this.editorScrollWatcher.destroy();
    console.log('[Recorder] Destroyed');
  }
}
