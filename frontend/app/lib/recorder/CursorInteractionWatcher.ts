/**
 * Cursor Interaction Watcher
 *
 * Captures mouse click events (mousedown/mouseup) for playback visualization.
 * Records the click position and button type.
 */

import type { Recorder } from './Recorder';
import { EventTypes } from '~/types/events';

export class CursorInteractionWatcher {
  private recorder: Recorder;
  private isWatching: boolean = false;

  constructor(recorder: Recorder) {
    this.recorder = recorder;
  }

  /**
   * Start watching for mouse interactions
   */
  watch(): void {
    if (this.isWatching) {
      console.warn('[CursorInteractionWatcher] Already watching');
      return;
    }

    this.isWatching = true;
    document.addEventListener('mousedown', this.handleMouseDown);
    console.log('[CursorInteractionWatcher] Started watching mouse interactions');
  }

  /**
   * Stop watching for mouse interactions
   */
  stop(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;
    document.removeEventListener('mousedown', this.handleMouseDown);
    console.log('[CursorInteractionWatcher] Stopped watching mouse interactions');
  }

  /**
   * Handle mousedown events
   */
  private handleMouseDown = (event: MouseEvent): void => {
    // Record the click event immediately
    this.recorder.addNewEvent('ui', EventTypes.MOUSE_CLICK, {
      x: event.clientX,
      y: event.clientY,
      btn: event.button, // 0=left, 1=middle, 2=right
    });

    console.log(`[CursorInteractionWatcher] Recorded click at (${event.clientX}, ${event.clientY}), button=${event.button}`);
  };

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
  }
}
