/**
 * EditorTabTrigger - Plays back Editor tab operations
 *
 * Components register callbacks that will be invoked during playback:
 * - onTabOpen: Opens a new tab
 * - onTabClose: Closes a tab
 * - onTabSwitch: Switches to a different tab
 */

export class EditorTabTrigger {
  private onTabOpenCallback: ((filePath: string) => void) | null = null;
  private onTabCloseCallback: ((filePath: string) => void) | null = null;
  private onTabSwitchCallback: ((filePath: string) => void) | null = null;
  private onGetOpenTabsCallback: (() => string[]) | null = null;

  /**
   * Register callback for tab open events
   * Called by file-explorer component
   */
  setOnTabOpen(callback: (filePath: string) => void): void {
    this.onTabOpenCallback = callback;
    console.log('[EditorTabTrigger] Tab open callback registered');
  }

  /**
   * Register callback for tab close events
   * Called by editor component
   */
  setOnTabClose(callback: (filePath: string) => void): void {
    this.onTabCloseCallback = callback;
    console.log('[EditorTabTrigger] Tab close callback registered');
  }

  /**
   * Register callback for tab switch events
   * Called by editor component
   */
  setOnTabSwitch(callback: (filePath: string) => void): void {
    this.onTabSwitchCallback = callback;
    console.log('[EditorTabTrigger] Tab switch callback registered');
  }

  /**
   * Register callback for getting current open tabs
   * Called by editor component to allow snapshot restoration to diff current vs target state
   */
  setOnGetOpenTabs(callback: () => string[]): void {
    this.onGetOpenTabsCallback = callback;
    console.log('[EditorTabTrigger] Get open tabs callback registered');
  }

  /**
   * Trigger tab open during playback
   */
  playTabOpen(filePath: string): void {
    if (this.onTabOpenCallback) {
      this.onTabOpenCallback(filePath);
      console.log(`[EditorTabTrigger] Playing tab open: ${filePath}`);
    } else {
      console.warn(`[EditorTabTrigger] No tab open callback registered for: ${filePath}`);
    }
  }

  /**
   * Trigger tab close during playback
   */
  playTabClose(filePath: string): void {
    if (this.onTabCloseCallback) {
      this.onTabCloseCallback(filePath);
      console.log(`[EditorTabTrigger] Playing tab close: ${filePath}`);
    } else {
      console.warn(`[EditorTabTrigger] No tab close callback registered for: ${filePath}`);
    }
  }

  /**
   * Trigger tab switch during playback
   */
  playTabSwitch(filePath: string): void {
    if (this.onTabSwitchCallback) {
      this.onTabSwitchCallback(filePath);
      console.log(`[EditorTabTrigger] Playing tab switch: ${filePath}`);
    } else {
      console.warn(`[EditorTabTrigger] No tab switch callback registered for: ${filePath}`);
    }
  }

  /**
   * Apply a full snapshot of tab state
   *
   * This method performs complete tab synchronization:
   * 1. Closes tabs that are open but NOT in the snapshot
   * 2. Opens tabs that are in the snapshot but not currently open
   * 3. Switches to the active file from the snapshot
   *
   * NOTE: With Git-based state management, file contents are NOT stored in snapshots.
   * Files are restored via Git checkout in the Worker filesystem. This method opens
   * tabs with empty content initially, and the UI components should request actual
   * content from the Worker via WebSocket.
   *
   * @param editorTabs - Tab state from snapshot (which files are open, which is active)
   */
  applyTabSnapshot(
    editorTabs: { openFiles: string[]; activeFile: string | null }
  ): void {
    // Get current open tabs from the UI
    const currentTabs = this.onGetOpenTabsCallback?.() ?? [];
    console.log(`[EditorTabTrigger] Applying tab snapshot - Current: ${currentTabs.length} tabs, Target: ${editorTabs.openFiles.length} tabs`);

    // Step 1: Close tabs that are NOT in the snapshot
    currentTabs.forEach(tabPath => {
      if (!editorTabs.openFiles.includes(tabPath)) {
        if (this.onTabCloseCallback) {
          this.onTabCloseCallback(tabPath);
          console.log(`[EditorTabTrigger] Closing tab not in snapshot: ${tabPath}`);
        }
      }
    });

    // Step 2: Open tabs in the snapshot (if not already open)
    editorTabs.openFiles.forEach(filePath => {
      if (!currentTabs.includes(filePath)) {
        if (this.onTabOpenCallback) {
          // Content will be read from Worker filesystem
          this.onTabOpenCallback(filePath);
          console.log(`[EditorTabTrigger] Opening tab from snapshot: ${filePath} (content will be read from Worker)`);
        }
      }
    });

    // Step 3: Switch to active file if specified
    if (editorTabs.activeFile && this.onTabSwitchCallback) {
      // Content will be read from Worker filesystem
      this.onTabSwitchCallback(editorTabs.activeFile);
      console.log(`[EditorTabTrigger] Setting active tab from snapshot: ${editorTabs.activeFile}`);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.onTabOpenCallback = null;
    this.onTabCloseCallback = null;
    this.onTabSwitchCallback = null;
    this.onGetOpenTabsCallback = null;
    console.log('[EditorTabTrigger] Destroyed');
  }
}
