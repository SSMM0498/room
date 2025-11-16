/**
 * Cursor Interaction Watcher
 *
 * Captures mouse click events (mousedown/mouseup) for playback visualization.
 * Records the click position and button type.
 */

import { EventTypes } from '~/types/events';

type AddEventCallback = <P>(src: string, act: string, payload: P, timestamp?: number) => void;

export class CursorInteractionWatcher {
  private addEvent: AddEventCallback;
  private isWatching: boolean = false;

  constructor(addEvent: AddEventCallback) {
    this.addEvent = addEvent;
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
  }

  /**
   * Handle mousedown events
   */
  private handleMouseDown = (event: MouseEvent): void => {
    // Record the click event immediately
    this.addEvent('ui', EventTypes.MOUSE_CLICK, {
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
