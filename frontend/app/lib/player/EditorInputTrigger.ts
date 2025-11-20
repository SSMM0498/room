/**
 * EditorInputTrigger - Plays back editor input events (typing, paste, selection)
 *
 * Receives callbacks from the editor component and triggers input actions
 * during playback.
 */

export class EditorInputTrigger {
  private onTypeCallback: ((filePath: string, chunk: string) => void) | null = null;
  private onPasteCallback: ((filePath: string, content: string, position?: [number, number]) => void) | null = null;
  private onSelectCallback: ((filePath: string, start: [number, number], end: [number, number]) => void) | null = null;

  /**
   * Register callback for typing playback
   * @param callback - Function to execute when typing event is played
   */
  setOnType(callback: (filePath: string, chunk: string) => void): void {
    this.onTypeCallback = callback;
    console.log('[EditorInputTrigger] Type callback registered');
  }

  /**
   * Register callback for paste playback
   * @param callback - Function to execute when paste event is played
   */
  setOnPaste(callback: (filePath: string, content: string, position?: [number, number]) => void): void {
    this.onPasteCallback = callback;
    console.log('[EditorInputTrigger] Paste callback registered');
  }

  /**
   * Register callback for selection playback
   * @param callback - Function to execute when selection event is played
   */
  setOnSelect(callback: (filePath: string, start: [number, number], end: [number, number]) => void): void {
    this.onSelectCallback = callback;
    console.log('[EditorInputTrigger] Select callback registered');
  }

  /**
   * Play a typing action
   * @param filePath - Path of file being typed in
   * @param chunk - Characters that were typed
   */
  playType(filePath: string, chunk: string): void {
    if (this.onTypeCallback) {
      this.onTypeCallback(filePath, chunk);
      console.log(`[EditorInputTrigger] Playing typing: ${filePath} (${chunk.length} chars)`);
    } else {
      console.warn('[EditorInputTrigger] No type callback registered');
    }
  }

  /**
   * Play a paste action
   * @param filePath - Path of file being pasted into
   * @param content - Content that was pasted
   * @param position - Optional cursor position
   */
  playPaste(filePath: string, content: string, position?: [number, number]): void {
    if (this.onPasteCallback) {
      this.onPasteCallback(filePath, content, position);
      console.log(`[EditorInputTrigger] Playing paste: ${filePath} (${content.length} chars)`);
    } else {
      console.warn('[EditorInputTrigger] No paste callback registered');
    }
  }

  /**
   * Play a selection action
   * @param filePath - Path of file with selection
   * @param start - Selection start [line, column]
   * @param end - Selection end [line, column]
   */
  playSelect(filePath: string, start: [number, number], end: [number, number]): void {
    if (this.onSelectCallback) {
      this.onSelectCallback(filePath, start, end);
      console.log(`[EditorInputTrigger] Playing selection: ${filePath} [${start.join(',')}] to [${end.join(',')}]`);
    } else {
      console.warn('[EditorInputTrigger] No select callback registered');
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.onTypeCallback = null;
    this.onPasteCallback = null;
    this.onSelectCallback = null;
    console.log('[EditorInputTrigger] Destroyed');
  }
}
