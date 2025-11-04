/**
 * Scroll Watcher
 *
 * Captures scroll events from editor and terminal components.
 * Uses throttling to prevent excessive event recording.
 */

import type { Recorder } from './Recorder';
import { EventTypes } from '~/types/events';

/**
 * Configuration for a scrollable element
 */
interface ScrollConfig {
  type: 'editor' | 'terminal' | 'browser' | 'file-explorer';
  id: string; // file path for editor, terminal ID for terminal, optional for browser/file-explorer
}

export class ScrollWatcher {
  private recorder: Recorder;
  private isWatching: boolean = false;
  private throttleTimers: Map<string, number> = new Map();
  private throttleDelay: number = 100; // ms - throttle scroll events
  private scrollableElements: Map<HTMLElement, ScrollConfig> = new Map();

  constructor(recorder: Recorder) {
    this.recorder = recorder;
  }

  /**
   * Register a scrollable element to watch
   * @param element - The scrollable DOM element
   * @param type - Type of component ('editor', 'terminal', 'browser', or 'file-explorer')
   * @param id - Identifier (file path for editor, terminal ID for terminal, instance ID for browser/file-explorer)
   */
  registerScrollable(element: HTMLElement, type: 'editor' | 'terminal' | 'browser' | 'file-explorer', id: string): void {
    if (!element) {
      console.warn('[ScrollWatcher] Cannot register null element');
      return;
    }

    const config: ScrollConfig = { type, id };
    this.scrollableElements.set(element, config);

    // If already watching, attach listener immediately
    if (this.isWatching) {
      element.addEventListener('scroll', this.handleScroll);
    }

    console.log(`[ScrollWatcher] Registered ${type} scrollable: ${id}`);
  }

  /**
   * Unregister a scrollable element
   */
  unregisterScrollable(element: HTMLElement): void {
    if (!element) return;

    const config = this.scrollableElements.get(element);
    if (config) {
      element.removeEventListener('scroll', this.handleScroll);
      this.scrollableElements.delete(element);

      // Clear any pending throttle timer
      const timerId = this.throttleTimers.get(config.id);
      if (timerId) {
        clearTimeout(timerId);
        this.throttleTimers.delete(config.id);
      }

      console.log(`[ScrollWatcher] Unregistered ${config.type} scrollable: ${config.id}`);
    }
  }

  /**
   * Start watching for scroll events
   */
  watch(): void {
    if (this.isWatching) {
      console.warn('[ScrollWatcher] Already watching');
      return;
    }

    this.isWatching = true;

    // Attach scroll listeners to all registered elements
    for (const element of this.scrollableElements.keys()) {
      element.addEventListener('scroll', this.handleScroll);
    }

    console.log(`[ScrollWatcher] Started watching ${this.scrollableElements.size} scrollable elements`);
  }

  /**
   * Stop watching for scroll events
   */
  stop(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;

    // Remove all scroll listeners
    for (const element of this.scrollableElements.keys()) {
      element.removeEventListener('scroll', this.handleScroll);
    }

    // Clear all pending throttle timers
    for (const timerId of this.throttleTimers.values()) {
      clearTimeout(timerId);
    }
    this.throttleTimers.clear();

    console.log('[ScrollWatcher] Stopped watching scroll events');
  }

  /**
   * Handle scroll events with throttling
   */
  private handleScroll = (event: Event): void => {
    const element = event.target as HTMLElement;
    if (!element) return;

    const config = this.scrollableElements.get(element);
    if (!config) return;

    // Check if there's already a pending timer for this element
    const existingTimer = this.throttleTimers.get(config.id);
    if (existingTimer) {
      return; // Still throttling, ignore this event
    }

    // Set throttle timer
    const timerId = window.setTimeout(() => {
      this.throttleTimers.delete(config.id);
    }, this.throttleDelay);
    this.throttleTimers.set(config.id, timerId);

    // Record the scroll event
    this.recordScroll(element, config);
  };

  /**
   * Record a scroll event
   */
  private recordScroll(element: HTMLElement, config: ScrollConfig): void {
    const scrollTop = element.scrollTop;
    const scrollLeft = element.scrollLeft;

    if (config.type === 'editor') {
      // Record editor scroll
      this.recorder.addNewEvent('ui', EventTypes.EDITOR_SCROLL, {
        f: config.id, // file path
        top: scrollTop,
        left: scrollLeft,
      });

      console.log(`[ScrollWatcher] Recorded editor scroll: ${config.id} (${scrollTop}, ${scrollLeft})`);
    } else if (config.type === 'terminal') {
      // Record terminal scroll
      this.recorder.addNewEvent('ui', EventTypes.TERMINAL_SCROLL, {
        id: config.id, // terminal ID
        top: scrollTop,
      });

      console.log(`[ScrollWatcher] Recorded terminal scroll: ${config.id} (${scrollTop})`);
    } else if (config.type === 'browser') {
      // Record browser scroll
      this.recorder.addNewEvent('ui', EventTypes.BROWSER_SCROLL, {
        id: config.id, // browser instance ID
        top: scrollTop,
        left: scrollLeft,
      });

      console.log(`[ScrollWatcher] Recorded browser scroll: ${config.id} (${scrollTop}, ${scrollLeft})`);
    } else if (config.type === 'file-explorer') {
      // Record file explorer scroll
      this.recorder.addNewEvent('ui', EventTypes.FILE_EXPLORER_SCROLL, {
        id: config.id, // file explorer instance ID
        top: scrollTop,
      });

      console.log(`[ScrollWatcher] Recorded file explorer scroll: ${config.id} (${scrollTop})`);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.scrollableElements.clear();
  }
}
