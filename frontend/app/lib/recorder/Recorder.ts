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
import { IdeTabWatcher } from './IdeTabWatcher';
import { ResourceWatcher } from './ResourceWatcher';
import { CommitHashTracker } from './CommitHashTracker';
import type { RecorderConfig, IDEStateCapture, RecorderStatus } from './types';

export class Recorder {
  private eventsTimeLine: AnyActionPacket[] = [];
  private isRecording = false;
  private startTime: number = 0;

  // Interval IDs for snapshot timers
  private fullSnapshotIntervalId: number | null = null;
  private deltaSnapshotIntervalId: number | null = null;

  // Configuration
  private config: Required<RecorderConfig>;

  // State capture interface
  private stateCapture: IDEStateCapture | null = null;

  // Snapshot manager
  private snapshotManager: SnapshotManager;

  // Cursor movement watcher
  private cursorWatcher: CursorMovementWatcher;

  // Cursor interaction watcher (clicks)
  private clickWatcher: CursorInteractionWatcher;

  // Cursor style watcher (cursor appearance changes)
  private styleWatcher: CursorStyleWatcher;

  // IDE tab watcher (tab open/close/switch events)
  private ideTabWatcher: IdeTabWatcher;

  // Resource watcher (file/folder operations)
  private resourceWatcher: ResourceWatcher;

  // Commit hash tracker (Git commit tracking + snapshot triggers)
  private commitHashTracker: CommitHashTracker;

  constructor(config: RecorderConfig = {}) {
    this.config = {
      fullSnapshotInterval: config.fullSnapshotInterval ?? 15000,
      deltaSnapshotInterval: config.deltaSnapshotInterval ?? 1500,
      version: config.version ?? 1,
    };
    this.addNewEvent = this.addNewEvent.bind(this);
    this.snapshotManager = new SnapshotManager();
    this.cursorWatcher = new CursorMovementWatcher(this.addNewEvent);
    this.clickWatcher = new CursorInteractionWatcher(this.addNewEvent);
    this.styleWatcher = new CursorStyleWatcher(this.addNewEvent);
    this.ideTabWatcher = new IdeTabWatcher(this);
    this.resourceWatcher = new ResourceWatcher(this);
    // CommitHashTracker triggers delta snapshots on every commit
    this.commitHashTracker = new CommitHashTracker((hash: string) => {
      this.takeDeltaSnapshot();
    });
  }

  /**
   * Sets the state capture interface that provides IDE and workspace state
   */
  setStateCapture(capture: IDEStateCapture): void {
    this.stateCapture = capture;
  }

  /**
   * Get the IDE tab watcher instance for components to record tab events
   */
  getIdeTabWatcher(): IdeTabWatcher {
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

    // Add the meta:start event
    this.addNewEvent<MetaStartPayload>(
      'meta',
      EventTypes.META_START,
      {
        version: this.config.version,
        timestamp: this.startTime,
      }
    );

    // Take an immediate full snapshot to establish baseline
    this.takeFullSnapshot();

    // Start periodic snapshot intervals
    this.startSnapshotIntervals();

    // Start watchers
    this.cursorWatcher.watch();
    this.clickWatcher.watch();
    this.styleWatcher.watch();

    console.log('[Recorder] Recording started at', new Date(this.startTime).toISOString());
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
    this.cursorWatcher.stop();
    this.clickWatcher.stop();
    this.styleWatcher.stop();

    // Stop snapshot intervals
    this.stopSnapshotIntervals();

    // Take a final full snapshot
    this.takeFullSnapshot();

    // Add the meta:end event
    const endTime = Date.now();
    this.addNewEvent<MetaEndPayload>(
      'meta',
      EventTypes.META_END,
      {
        timestamp: endTime,
      }
    );

    this.isRecording = false;

    console.log('[Recorder] Recording stopped. Duration:', (endTime - this.startTime) / 1000, 'seconds');
    console.log('[Recorder] Total events:', this.eventsTimeLine.length);
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
  takeFullSnapshot(): void {
    if (!this.stateCapture) {
      console.warn('[Recorder] Cannot take snapshot: state capture not configured');
      return;
    }

    const uiState = this.stateCapture.getUIState();
    const commitHash = this.commitHashTracker.getLatestCommitHash();

    const snapshotPayload = this.snapshotManager.createFullSnapshot(uiState, commitHash);

    this.addNewEvent<SnapshotPayload>(
      'state',
      EventTypes.STATE_SNAPSHOT_FULL,
      snapshotPayload
    );

    console.log('[Recorder] Full snapshot taken at', Date.now(), 'with commit:', commitHash.substring(0, 8));
  }

  /**
   * Takes a delta snapshot (only changes since last snapshot)
   */
  takeDeltaSnapshot(): void {
    if (!this.stateCapture) {
      console.warn('[Recorder] Cannot take snapshot: state capture not configured');
      return;
    }

    const currentUIState = this.stateCapture.getUIState();
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
}
