/**
 * EditorInputWatcher - Records editor input events (typing, paste, selection)
 *
 * Called by the Monaco editor component for various input operations.
 * Implements batching for typing events to reduce event volume.
 */

import { EventTypes } from '~/types/events';
import type { EditorTypePayload, EditorPastePayload, EditorSelectPayload, AddEventCallback } from '~/types/events';

// TODO: Save caret position
export class EditorInputWatcher {
  private addEvent: AddEventCallback;

  // Typing batching state
  private typingBuffer: string = '';
  private typingFilePath: string = '';
  private typingTimer: number | null = null;
  private readonly TYPING_BATCH_DELAY = 1000; // ms

  constructor(addEvent: AddEventCallback) {
    this.addEvent = addEvent;
  }

  /**
   * Record typing in the editor
   * Batches characters into chunks to reduce event volume
   * @param filePath - Path of the file being edited
   * @param text - Characters typed
   */
  recordTyping(filePath: string, text: string): void {
    // If file changed, flush existing buffer first
    if (this.typingFilePath && this.typingFilePath !== filePath) {
      this.flushTypingBuffer();
    }

    // Add to buffer
    this.typingFilePath = filePath;
    this.typingBuffer += text;

    // Reset timer
    if (this.typingTimer !== null) {
      clearTimeout(this.typingTimer);
    }

    // Schedule flush
    this.typingTimer = window.setTimeout(() => {
      this.flushTypingBuffer();
    }, this.TYPING_BATCH_DELAY);
  }

  /**
   * Flush the typing buffer immediately
   * Called when switching files or on significant pauses (1s)
   */
  flushTypingBuffer(): void {
    if (this.typingBuffer && this.typingFilePath) {
      this.addEvent<EditorTypePayload>('ui', EventTypes.EDITOR_TYPE, {
        f: this.typingFilePath,
        c: this.typingBuffer,
      });
      console.log(`[EditorInputWatcher] Typing recorded: ${this.typingFilePath} (${this.typingBuffer.length} chars)`);
    }

    // Clear state
    this.typingBuffer = '';
    this.typingFilePath = '';
    if (this.typingTimer !== null) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
  }

  /**
   * Record a paste event
   * @param filePath - Path of the file being edited
   * @param content - Pasted content
   * @param position - Optional cursor position [line, column]
   */
  recordPaste(filePath: string, content: string, position?: [number, number]): void {
    // Flush any pending typing first
    this.flushTypingBuffer();

    this.addEvent<EditorPastePayload>('ui', EventTypes.EDITOR_PASTE, {
      f: filePath,
      c: content,
      pos: position,
    });
    console.log(`[EditorInputWatcher] Paste recorded: ${filePath} (${content.length} chars)`);
  }

  /**
   * Record a text selection change
   * @param filePath - Path of the file being edited
   * @param start - Selection start [line, column]
   * @param end - Selection end [line, column]
   */
  recordSelection(filePath: string, start: [number, number], end: [number, number]): void {
    this.addEvent<EditorSelectPayload>('ui', EventTypes.EDITOR_SELECT, {
      f: filePath,
      s: start,
      e: end,
    });
    console.log(`[EditorInputWatcher] Selection recorded: ${filePath} [${start.join(',')}] to [${end.join(',')}]`);
  }

  /**
   * Clean up - flush any pending batched events
   * Called when recording stops
   */
  cleanup(): void {
    this.flushTypingBuffer();
  }
}
