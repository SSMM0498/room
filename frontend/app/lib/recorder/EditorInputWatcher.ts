/**
 * Editor Input Watcher
 *
 * Captures typing and paste events in the Monaco editor.
 * Uses debouncing to distinguish between typing and pasting.
 */

import type { Recorder } from './Recorder';
import { EventTypes } from '~/types/events';
import type * as Monaco from 'monaco-editor';
import type { ActiveFile } from '~~/types/file-tree';

interface EditorConfig {
  filePath: string;
  editor: Monaco.editor.IStandaloneCodeEditor;
  previousContent: string;
  debounceTimer: number | null;
  disposable: Monaco.IDisposable | null;
}

export class EditorInputWatcher {
  private recorder: Recorder;
  private isWatching: boolean = false;
  private editors: Map<Monaco.editor.IStandaloneCodeEditor, EditorConfig> = new Map();
  private debounceDelay: number = 600; // ms - wait time to consider typing finished
  private pasteThreshold: number = 20; // characters - if more than this, consider it a paste

  constructor(recorder: Recorder) {
    this.recorder = recorder;
  }

  /**
   * Register an editor instance to watch for input events
   * @param editor - Monaco editor instance
   * @param filePath - The file path being edited
   */
  registerEditor(editor: Monaco.editor.IStandaloneCodeEditor, filePath: string, activeTab?: ActiveFile): void {
    console.log("[EditorInputWatcher] Attempting to register editor for:", filePath);
    if (!editor) {
      console.warn('[EditorInputWatcher] Cannot register null editor');
      return;
    }

    // Check if already registered
    if (this.editors.has(editor)) {
      console.warn('[EditorInputWatcher] Editor already registered');
      return;
    }

    const config: EditorConfig = {
      filePath,
      editor,
      previousContent: activeTab?.fileContent || '',
      debounceTimer: null,
      disposable: null,
    };

    // Attach change listener
    // setTimeout(() => {
    console.log("[EditorInputWatcher] Setting up content change listener for:", filePath);
    const disposable = editor.onDidChangeModelContent(() => {
      this.handleContentChange(editor, activeTab);

      config.disposable = disposable;
      this.editors.set(editor, config);
    });
    // })
    console.log(`[EditorInputWatcher] Registered editor for: ${filePath}`);
  }

  /**
   * Unregister an editor instance
   */
  unregisterEditor(editor: Monaco.editor.IStandaloneCodeEditor): void {
    const config = this.editors.get(editor);
    if (!config) return;

    // Clear debounce timer
    if (config.debounceTimer !== null) {
      clearTimeout(config.debounceTimer);
    }

    // Dispose change listener
    if (config.disposable) {
      config.disposable.dispose();
    }

    this.editors.delete(editor);
    console.log(`[EditorInputWatcher] Unregistered editor for: ${config.filePath}`);
  }

  /**
   * Update the file path for an editor (when switching files)
   */
  updateFilePath(editor: Monaco.editor.IStandaloneCodeEditor, newFilePath: string, activeTab?: ActiveFile): void {
    const config = this.editors.get(editor);
    if (!config) return;

    config.filePath = newFilePath;
    config.previousContent = activeTab?.fileContent || '';
    console.log(`[EditorInputWatcher] Updated file path to: ${newFilePath}`);
  }

  /**
   * Start watching for input events
   */
  watch(): void {
    if (this.isWatching) {
      console.warn('[EditorInputWatcher] Already watching');
      return;
    }

    this.isWatching = true;
    console.log('[EditorInputWatcher] Started watching editor input');
  }

  /**
   * Stop watching for input events
   */
  stop(): void {
    if (!this.isWatching) {
      return;
    }

    this.isWatching = false;

    // Clear all debounce timers
    for (const config of this.editors.values()) {
      if (config.debounceTimer !== null) {
        clearTimeout(config.debounceTimer);
        config.debounceTimer = null;
      }
    }

    console.log('[EditorInputWatcher] Stopped watching editor input');
  }

  /**
   * Handle content change in editor
   */
  private handleContentChange(editor: Monaco.editor.IStandaloneCodeEditor, activeTab?: ActiveFile): void {
    if (!this.isWatching) return;

    const config = this.editors.get(editor);
    if (!config) return;

    // Clear existing debounce timer
    if (config.debounceTimer !== null) {
      clearTimeout(config.debounceTimer);
    }

    // Set new debounce timer
    config.debounceTimer = window.setTimeout(() => {
      this.recordChange(editor, activeTab);
      config.debounceTimer = null;
    }, this.debounceDelay);
  }

  /**
   * Record the change after debounce
   */
  private recordChange(editor: Monaco.editor.IStandaloneCodeEditor, activeTab?: ActiveFile): void {
    debugger
    const config = this.editors.get(editor);
    if (!config) return;

    const currentContent = activeTab?.fileContent || '';
    const previousContent = config.previousContent;

    // Calculate the difference
    const change = this.calculateChange(previousContent, currentContent);

    if (!change) {
      // No meaningful change
      config.previousContent = currentContent;
      return;
    }

    // Determine if it's a paste or typing
    const isPaste = change.length > this.pasteThreshold;

    if (isPaste) {
      // Record as paste event
      const position = editor.getPosition();
      this.recorder.addNewEvent('ui', EventTypes.EDITOR_PASTE, {
        f: config.filePath,
        c: change,
        pos: position ? [position.lineNumber, position.column] : undefined,
      });

      console.log(`[EditorInputWatcher] Recorded paste in ${config.filePath}: ${change.length} chars`);
    } else {
      // Record as typing event
      this.recorder.addNewEvent('ui', EventTypes.EDITOR_TYPE, {
        f: config.filePath,
        c: change,
      });

      console.log(`[EditorInputWatcher] Recorded typing in ${config.filePath}: "${change}"`);
    }

    // Update previous content
    config.previousContent = currentContent;
  }

  /**
   * Calculate the change between two strings
   * Returns the added text (simplified - assumes insertion at end or middle)
   */
  private calculateChange(oldContent: string, newContent: string): string {
    // Simple case: text was added
    if (newContent.length > oldContent.length) {
      // Try to find where the insertion happened
      let i = 0;
      while (i < oldContent.length && oldContent[i] === newContent[i]) {
        i++;
      }

      // Extract the inserted text
      const insertedLength = newContent.length - oldContent.length;
      return newContent.substr(i, insertedLength);
    }

    // For deletions or no change, return empty (we don't track deletions in this implementation)
    return '';
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();

    // Dispose all editor listeners
    for (const config of this.editors.values()) {
      if (config.disposable) {
        config.disposable.dispose();
      }
    }

    this.editors.clear();
  }
}
