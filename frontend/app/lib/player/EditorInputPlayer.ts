/**
 * Editor Input Player
 *
 * Plays back typing and paste events in the Monaco editor.
 * Typing events are animated character-by-character for realism.
 * Paste events are applied instantly.
 */

import type { EditorTypePayload, EditorPastePayload } from '~/types/events';
import type * as Monaco from 'monaco-editor';

interface TypingAnimation {
  text: string;
  currentIndex: number;
  intervalId: number | null;
  filePath: string;
}

export class EditorInputPlayer {
  private editors: Map<string, Monaco.editor.IStandaloneCodeEditor> = new Map(); // filePath -> editor
  private currentAnimation: TypingAnimation | null = null;
  private typingSpeed: number = 40; // ms between characters

  /**
   * Register an editor instance for playback
   * @param filePath - The file path identifier
   * @param editor - Monaco editor instance
   */
  registerEditor(filePath: string, editor: Monaco.editor.IStandaloneCodeEditor): void {
    if (!editor) {
      console.warn('[EditorInputPlayer] Cannot register null editor');
      return;
    }

    this.editors.set(filePath, editor);
    console.log(`[EditorInputPlayer] Registered editor: ${filePath}`);
  }

  /**
   * Unregister an editor instance
   */
  unregisterEditor(filePath: string): void {
    if (this.editors.delete(filePath)) {
      console.log(`[EditorInputPlayer] Unregistered editor: ${filePath}`);
    }
  }

  /**
   * Play typing event with character-by-character animation
   */
  playType(payload: EditorTypePayload): Promise<void> {
    const editor = this.editors.get(payload.f);
    if (!editor) {
      console.warn(`[EditorInputPlayer] Editor not found: ${payload.f}`);
      return Promise.resolve();
    }

    // Cancel any existing animation
    this.cancelAnimation();

    return new Promise((resolve) => {
      const text = payload.c;
      let currentIndex = 0;

      const animation: TypingAnimation = {
        text,
        currentIndex,
        intervalId: null,
        filePath: payload.f,
      };

      this.currentAnimation = animation;

      // Get current position
      const position = editor.getPosition() || { lineNumber: 1, column: 1 };
      const model = editor.getModel();
      if (!model) {
        resolve();
        return;
      }

      // Animate character by character
      animation.intervalId = window.setInterval(() => {
        if (currentIndex >= text.length) {
          // Animation complete
          if (animation.intervalId !== null) {
            clearInterval(animation.intervalId);
          }
          this.currentAnimation = null;
          console.log(`[EditorInputPlayer] Finished typing in ${payload.f}`);
          resolve();
          return;
        }

        // Insert next character
        const char = text[currentIndex];
        if (char === undefined) {
          console.warn('[EditorInputPlayer] Unexpected undefined character');
          currentIndex++;
          return;
        }

        const currentPos = editor.getPosition() || position;

        // Insert the character at current cursor position
        editor.executeEdits('typing-animation', [
          {
            range: new (window as any).monaco.Range(
              currentPos.lineNumber,
              currentPos.column,
              currentPos.lineNumber,
              currentPos.column
            ),
            text: char,
          },
        ]);

        // Move cursor forward
        const newColumn = currentPos.column + 1;
        editor.setPosition({
          lineNumber: currentPos.lineNumber,
          column: newColumn,
        });

        currentIndex++;
        animation.currentIndex = currentIndex;
      }, this.typingSpeed);
    });
  }

  /**
   * Play paste event (instant insertion)
   */
  playPaste(payload: EditorPastePayload): void {
    const editor = this.editors.get(payload.f);
    if (!editor) {
      console.warn(`[EditorInputPlayer] Editor not found: ${payload.f}`);
      return;
    }

    // Cancel any existing animation
    this.cancelAnimation();

    const model = editor.getModel();
    if (!model) return;

    // Get position from payload or use current position
    let position: Monaco.IPosition;
    if (payload.pos) {
      position = {
        lineNumber: payload.pos[0],
        column: payload.pos[1],
      };
    } else {
      position = editor.getPosition() || { lineNumber: 1, column: 1 };
    }

    // Insert the pasted text instantly
    editor.executeEdits('paste-playback', [
      {
        range: new (window as any).monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        text: payload.c,
      },
    ]);

    // Move cursor to end of pasted text
    const lines = payload.c.split('\n');
    const lastLine = lines[lines.length - 1] || '';
    const newLineNumber = position.lineNumber + lines.length - 1;
    const newColumn = lines.length === 1 ? position.column + lastLine.length : lastLine.length + 1;

    editor.setPosition({
      lineNumber: newLineNumber,
      column: newColumn,
    });

    console.log(`[EditorInputPlayer] Pasted ${payload.c.length} chars in ${payload.f}`);
  }

  /**
   * Cancel any ongoing typing animation
   */
  private cancelAnimation(): void {
    if (this.currentAnimation && this.currentAnimation.intervalId !== null) {
      clearInterval(this.currentAnimation.intervalId);
      this.currentAnimation = null;
    }
  }

  /**
   * Set the typing speed
   * @param speed - Delay in ms between characters (default: 40ms)
   */
  setTypingSpeed(speed: number): void {
    this.typingSpeed = speed;
  }

  /**
   * Get all registered editor file paths
   */
  getRegisteredEditors(): string[] {
    return Array.from(this.editors.keys());
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.cancelAnimation();
    this.editors.clear();
    console.log('[EditorInputPlayer] Cleared all editor registrations');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.cancelAnimation();
    this.clear();
  }
}
