/**
 * IdeTabPlayer - Plays back IDE tab operations
 *
 * Components register callbacks that will be invoked during playback:
 * - onTabOpen: Opens a new tab
 * - onTabClose: Closes a tab
 * - onTabSwitch: Switches to a different tab
 */

export class IdeTabPlayer {
  private onTabOpenCallback: ((filePath: string, content: string) => void) | null = null;
  private onTabCloseCallback: ((filePath: string) => void) | null = null;
  private onTabSwitchCallback: ((filePath: string, content: string) => void) | null = null;

  /**
   * Register callback for tab open events
   * Called by file-explorer component
   */
  setOnTabOpen(callback: (filePath: string, content: string) => void): void {
    this.onTabOpenCallback = callback;
    console.log('[IdeTabPlayer] Tab open callback registered');
  }

  /**
   * Register callback for tab close events
   * Called by editor component
   */
  setOnTabClose(callback: (filePath: string) => void): void {
    this.onTabCloseCallback = callback;
    console.log('[IdeTabPlayer] Tab close callback registered');
  }

  /**
   * Register callback for tab switch events
   * Called by editor component
   */
  setOnTabSwitch(callback: (filePath: string, content: string) => void): void {
    this.onTabSwitchCallback = callback;
    console.log('[IdeTabPlayer] Tab switch callback registered');
  }

  /**
   * Trigger tab open during playback
   */
  playTabOpen(filePath: string, content: string): void {
    if (this.onTabOpenCallback) {
      this.onTabOpenCallback(filePath, content);
      console.log(`[IdeTabPlayer] Playing tab open: ${filePath}`);
    } else {
      console.warn(`[IdeTabPlayer] No tab open callback registered for: ${filePath}`);
    }
  }

  /**
   * Trigger tab close during playback
   */
  playTabClose(filePath: string): void {
    if (this.onTabCloseCallback) {
      this.onTabCloseCallback(filePath);
      console.log(`[IdeTabPlayer] Playing tab close: ${filePath}`);
    } else {
      console.warn(`[IdeTabPlayer] No tab close callback registered for: ${filePath}`);
    }
  }

  /**
   * Trigger tab switch during playback
   */
  playTabSwitch(filePath: string, content: string): void {
    if (this.onTabSwitchCallback) {
      this.onTabSwitchCallback(filePath, content);
      console.log(`[IdeTabPlayer] Playing tab switch: ${filePath}`);
    } else {
      console.warn(`[IdeTabPlayer] No tab switch callback registered for: ${filePath}`);
    }
  }

  /**
   * Apply a full snapshot of tab state
   * 
   * This uses playTabOpen/Close/Switch to maintain same event flow,
   * but ensures the state exactly matches the snapshot
   */
  applyTabSnapshot(
    editorTabs: { openFiles: string[]; activeFile: string | null },
    workspaceFiles: Record<string, string>
  ): void {
    // Close all open tabs that aren't in snapshot
    if (this.onTabCloseCallback) {
      // We can't actually close tabs here since we don't know current state
      // The UI component will handle diffing and closing
      console.log('[IdeTabPlayer] Tab state will be reset by UI component');
    }

    // Open all files in snapshot with their content from workspace
    for (const filePath of editorTabs.openFiles) {
      if (this.onTabOpenCallback) {
        const content = workspaceFiles[filePath] || '';
        this.onTabOpenCallback(filePath, content);
        console.log(`[IdeTabPlayer] Opening tab from snapshot: ${filePath} (${content.length} chars)`);
      }
    }

    // Switch to active file if specified, using content from workspace
    if (editorTabs.activeFile && this.onTabSwitchCallback) {
      const content = workspaceFiles[editorTabs.activeFile] || '';
      this.onTabSwitchCallback(editorTabs.activeFile, content);
      console.log(`[IdeTabPlayer] Setting active tab from snapshot: ${editorTabs.activeFile}`);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.onTabOpenCallback = null;
    this.onTabCloseCallback = null;
    this.onTabSwitchCallback = null;
    console.log('[IdeTabPlayer] Destroyed');
  }
}
