/**
 * EditorScrollWatcher - Records editor scroll position changes
 *
 * Captures scroll movements with throttling and batching to prevent
 * flooding the event timeline with too many scroll position updates.
 * Each point is timestamped relative to the batch start for accurate replay.
 * Similar to CursorMovementWatcher but tracks per-file scroll positions.
 */

import { EventTypes } from '~/types/events';
import type { AddEventCallback, EditorScrollPathPayload, EditorScrollPosition } from '~/types/events';

export class EditorScrollWatcher {
  private addEvent: AddEventCallback;

  // Batching state per file
  private fileBatches: Map<string, {
    positions: EditorScrollPosition[];
    batchStartTime: number;
    flushTimer: number | null;
    lastCaptureTime: number;
  }> = new Map();

  // Timing configuration
  private captureThrottle: number = 15; // ms - capture point every 15ms
  private flushInterval: number = 500; // ms - emit batch every 500ms

  constructor(addEvent: AddEventCallback) {
    this.addEvent = addEvent;
  }

  /**
   * Record an editor scroll event with throttling and batching
   * Called by editor component when Monaco's onDidScrollChange fires
   * @param filePath - Path of the file being scrolled
   * @param top - Vertical scroll position
   * @param left - Horizontal scroll position
   */
  recordScroll(filePath: string, top: number, left: number): void {
    const now = Date.now();

    // Get or create batch for this file
    let batch = this.fileBatches.get(filePath);

    if (!batch) {
      batch = {
        positions: [],
        batchStartTime: now,
        flushTimer: null,
        lastCaptureTime: 0,
      };
      this.fileBatches.set(filePath, batch);
    }

    // Throttle: Only capture if enough time has passed since last capture
    if (now - batch.lastCaptureTime < this.captureThrottle) {
      return;
    }

    batch.lastCaptureTime = now;

    // Initialize batch if this is the first point
    if (batch.positions.length === 0) {
      batch.batchStartTime = now;

      // Schedule batch flush
      batch.flushTimer = window.setTimeout(() => {
        this.flushBatch(filePath);
      }, this.flushInterval);
    }

    // Calculate time offset from batch start
    const timeOffset = now - batch.batchStartTime;

    // Add point to batch
    batch.positions.push({
      top,
      left,
      timeOffset,
    });
  }

  /**
   * Flush the collected positions for a file as a single editor:scroll:path event
   */
  private flushBatch(filePath: string): void {
    const batch = this.fileBatches.get(filePath);
    if (!batch || batch.positions.length === 0) {
      return;
    }

    const now = Date.now();
    const totalDuration = now - batch.batchStartTime;

    // Adjust timeOffsets to be relative to the event timestamp (end of batch)
    // Make them negative so they point backwards in time from the event
    const positions: EditorScrollPosition[] = batch.positions.map(p => ({
      top: p.top,
      left: p.left,
      timeOffset: p.timeOffset - totalDuration, // Negative offset from event time
    }));

    // Emit a single editor:scroll:path event with all positions including timing
    this.addEvent<EditorScrollPathPayload>('ui', EventTypes.EDITOR_SCROLL, {
      f: filePath,
      positions,
    });

    console.log(`[EditorScrollWatcher] Flushed ${positions.length} scroll positions for ${filePath} over ${totalDuration}ms`);

    // Remove this file's batch
    this.fileBatches.delete(filePath);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Flush all pending batches
    for (const [filePath, batch] of this.fileBatches.entries()) {
      if (batch.flushTimer !== null) {
        clearTimeout(batch.flushTimer);
      }
      if (batch.positions.length > 0) {
        this.flushBatch(filePath);
      }
    }
    this.fileBatches.clear();
  }
}
