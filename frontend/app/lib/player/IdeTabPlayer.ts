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
   * Clean up resources
   */
  destroy(): void {
    this.onTabOpenCallback = null;
    this.onTabCloseCallback = null;
    this.onTabSwitchCallback = null;
    console.log('[IdeTabPlayer] Destroyed');
  }
}
