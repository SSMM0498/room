/**
 * Cursor Style Watcher
 *
 * Detects and records changes to the cursor style as the user moves
 * their mouse over different elements. Uses throttling to prevent
 * excessive event recording.
 */

import type { Recorder } from './Recorder';
import { EventTypes } from '~/types/events';

export class CursorStyleWatcher {
  private recorder: Recorder;
  private isWatching: boolean = false;
  private previousStyle: string = 'default';
  private throttleTimer: number | null = null;
  private throttleDelay: number = 100; // ms - throttle cursor style checks

  constructor(recorder: Recorder) {
    this.recorder = recorder;
  }

  /**
   * Start watching for cursor style changes
   */
  watch(): void {
    if (this.isWatching) {
      console.warn('[CursorStyleWatcher] Already watching');
      return;
    }

    this.isWatching = true;

    // Capture initial cursor style from document.body
    this.previousStyle = window.getComputedStyle(document.body).cursor || 'default';
    console.log('[CursorStyleWatcher] Initial cursor style:', this.previousStyle);

    // Attach mouseover event listener with throttling
    document.addEventListener('mouseover', this.handleMouseOver);

    console.log('[CursorStyleWatcher] Started watching cursor style changes');
  }

  /**
   * Stop watching for cursor style changes
   */
  stop(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;
    document.removeEventListener('mouseover', this.handleMouseOver);

    // Clear any pending throttle timer
    if (this.throttleTimer !== null) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }

    console.log('[CursorStyleWatcher] Stopped watching cursor style changes');
  }

  /**
   * Handle mouseover events with throttling
   */
  private handleMouseOver = (event: MouseEvent): void => {
    // Throttle the check to prevent excessive firing
    if (this.throttleTimer !== null) {
      return; // Still throttling, ignore this event
    }

    this.throttleTimer = window.setTimeout(() => {
      this.throttleTimer = null;
    }, this.throttleDelay);

    // Check cursor style change
    this.checkCursorStyleChange(event);
  };

  /**
   * Check if cursor style has changed and record if different
   */
  private checkCursorStyleChange(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    // Get computed cursor style from the element
    const currentStyle = window.getComputedStyle(target).cursor;

    // Compare with previous style
    if (currentStyle !== this.previousStyle) {
      // Style changed - record the event
      this.recorder.addNewEvent('ui', EventTypes.MOUSE_STYLE, {
        s: currentStyle,
      });

      console.log(`[CursorStyleWatcher] Cursor style changed: ${this.previousStyle} -> ${currentStyle}`);

      // Update previous style
      this.previousStyle = currentStyle;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
  }
}
