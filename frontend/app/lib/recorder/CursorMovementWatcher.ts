/**
 * Cursor Movement Watcher
 *
 * Captures mouse movements with throttling and batching to prevent
 * flooding the event timeline with too many mouse position updates.
 * Each point is timestamped relative to the batch start for accurate replay.
 */

import { EventTypes } from '~/types/events';

interface MousePoint {
  x: number;
  y: number;
  timeOffset: number; // Time since batch started (ms)
}

type AddEventCallback = <P>(src: string, act: string, payload: P, timestamp?: number) => void;

export class CursorMovementWatcher {
  private addEvent: AddEventCallback;
  private isWatching: boolean = false;

  // Batching state
  private positionsBatch: MousePoint[] = [];
  private batchStartTime: number | null = null;
  private lastCaptureTime: number = 0;

  // Timing configuration
  private captureThrottle: number = 15; // ms - capture point every 15ms
  private flushInterval: number = 500; // ms - emit batch every 500ms
  private flushTimer: number | null = null;

  constructor(addEvent: AddEventCallback) {
    this.addEvent = addEvent;
  }

  /**
   * Start watching for mouse movements
   */
  watch(): void {
    if (this.isWatching) {
      console.warn('[CursorMovementWatcher] Already watching');
      return;
    }

    this.isWatching = true;
    const options = { capture: true, passive: true };
    document.addEventListener('mousemove', this.handleMouseMove, options);
  }

  /**
   * Stop watching for mouse movements
   */
  stop(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;
    const options = { capture: true, passive: true };
    document.removeEventListener('mousemove', this.handleMouseMove, options);

    // Flush any remaining positions
    this.flushBatch();

    // Clear timer
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Handle mouse move events with throttling
   */
  private handleMouseMove = (event: MouseEvent): void => {
    const now = Date.now();

    // Throttle: Only capture if enough time has passed since last capture
    if (now - this.lastCaptureTime < this.captureThrottle) {
      return;
    }

    this.lastCaptureTime = now;

    // Initialize batch if this is the first point
    if (!this.batchStartTime) {
      this.batchStartTime = now;

      // Schedule batch flush
      this.flushTimer = window.setTimeout(() => {
        this.flushBatch();
      }, this.flushInterval);
    }

    // Calculate time offset from batch start
    const timeOffset = now - this.batchStartTime;

    // Add point to batch
    this.positionsBatch.push({
      x: event.clientX,
      y: event.clientY,
      timeOffset,
    });
  };

  /**
   * Flush the collected positions as a single mouse:path event
   */
  private flushBatch(): void {
    if (this.positionsBatch.length === 0) {
      return;
    }

    const now = Date.now();
    const totalDuration = now - this.batchStartTime!;

    // Adjust timeOffsets to be relative to the event timestamp (end of batch)
    // Make them negative so they point backwards in time from the event
    const positions = this.positionsBatch.map(p => ({
      x: p.x,
      y: p.y,
      timeOffset: p.timeOffset - totalDuration, // Negative offset from event time
    }));

    // Emit a single mouse:path event with all positions including timing
    this.addEvent('ui', EventTypes.MOUSE_PATH, {
      positions,
    });

    console.log(`[CursorMovementWatcher] Flushed ${positions.length} positions over ${totalDuration}ms`);

    // Reset batch state
    this.positionsBatch = [];
    this.batchStartTime = null;
    this.flushTimer = null;
  }
}
