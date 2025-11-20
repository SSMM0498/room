/**
 * ResourceTrigger - Plays back file system operations
 *
 * Components register callbacks that will be invoked during playback:
 * - onFolderExpand: Expands or collapses a folder
 * - onCreate: Creates a new file or folder
 * - onDelete: Deletes a file or folder
 * - onMove: Renames or moves a file or folder
 */

export class ResourceTrigger {
  private onFolderExpandCallback: ((
    path: string,
    expanded: boolean,
    content?: Array<{ name: string; path: string; type: 'file' | 'directory' }>
  ) => void) | null = null;
  private onCreateCallback: ((path: string, type: 'f' | 'd') => void) | null = null;
  private onDeleteCallback: ((path: string) => void) | null = null;
  private onMoveCallback: ((from: string, to: string) => void) | null = null;
  private onCreateInputShowCallback: ((type: 'file' | 'folder', parentPath: string) => void) | null = null;
  private onCreateInputTypeCallback: ((text: string) => void) | null = null;
  private onCreateInputHideCallback: ((cancelled: boolean) => void) | null = null;
  private onRenameInputShowCallback: ((path: string, currentName: string) => void) | null = null;
  private onRenameInputTypeCallback: ((text: string) => void) | null = null;
  private onRenameInputHideCallback: ((cancelled: boolean) => void) | null = null;
  private onPopoverShowCallback: ((path: string) => void) | null = null;
  private onPopoverHideCallback: ((path: string) => void) | null = null;

  /**
   * Register callback for folder expand/collapse events
   * Called by file-explorer component
   */
  setOnFolderExpand(
    callback: (
      path: string,
      expanded: boolean,
      content?: Array<{ name: string; path: string; type: 'file' | 'directory' }>
    ) => void
  ): void {
    this.onFolderExpandCallback = callback;
    console.log('[ResourceTrigger] Folder expand callback registered');
  }

  /**
   * Register callback for file/folder creation events
   * Called by file-explorer component
   */
  setOnCreate(callback: (path: string, type: 'f' | 'd') => void): void {
    this.onCreateCallback = callback;
    console.log('[ResourceTrigger] Create callback registered');
  }

  /**
   * Register callback for file/folder deletion events
   * Called by file-explorer component
   */
  setOnDelete(callback: (path: string) => void): void {
    this.onDeleteCallback = callback;
    console.log('[ResourceTrigger] Delete callback registered');
  }

  /**
   * Register callback for file/folder move/rename events
   * Called by file-explorer component
   */
  setOnMove(callback: (from: string, to: string) => void): void {
    this.onMoveCallback = callback;
    console.log('[ResourceTrigger] Move callback registered');
  }

  /**
   * Register callback for create input show events
   * Called by file-explorer component
   */
  setOnCreateInputShow(callback: (type: 'file' | 'folder', parentPath: string) => void): void {
    this.onCreateInputShowCallback = callback;
    console.log('[ResourceTrigger] Create input show callback registered');
  }

  /**
   * Register callback for create input type events
   * Called by file-explorer component
   */
  setOnCreateInputType(callback: (text: string) => void): void {
    this.onCreateInputTypeCallback = callback;
    console.log('[ResourceTrigger] Create input type callback registered');
  }

  /**
   * Register callback for create input hide events
   * Called by file-explorer component
   */
  setOnCreateInputHide(callback: (cancelled: boolean) => void): void {
    this.onCreateInputHideCallback = callback;
    console.log('[ResourceTrigger] Create input hide callback registered');
  }

  /**
   * Register callback for rename input show events
   * Called by file-explorer component
   */
  setOnRenameInputShow(callback: (path: string, currentName: string) => void): void {
    this.onRenameInputShowCallback = callback;
    console.log('[ResourceTrigger] Rename input show callback registered');
  }

  /**
   * Register callback for rename input type events
   * Called by file-explorer component
   */
  setOnRenameInputType(callback: (text: string) => void): void {
    this.onRenameInputTypeCallback = callback;
    console.log('[ResourceTrigger] Rename input type callback registered');
  }

  /**
   * Register callback for rename input hide events
   * Called by file-explorer component
   */
  setOnRenameInputHide(callback: (cancelled: boolean) => void): void {
    this.onRenameInputHideCallback = callback;
    console.log('[ResourceTrigger] Rename input hide callback registered');
  }

  /**
   * Register callback for popover show events
   * Called by file-explorer component
   */
  setOnPopoverShow(callback: (path: string) => void): void {
    this.onPopoverShowCallback = callback;
    console.log('[ResourceTrigger] Popover show callback registered');
  }

  /**
   * Register callback for popover hide events
   * Called by file-explorer component
   */
  setOnPopoverHide(callback: (path: string) => void): void {
    this.onPopoverHideCallback = callback;
    console.log('[ResourceTrigger] Popover hide callback registered');
  }

  /**
   * Trigger folder expand during playback
   */
  playFolderExpand(
    path: string,
    expanded: boolean,
    content?: Array<{ name: string; path: string; type: 'file' | 'directory' }>
  ): void {
    if (this.onFolderExpandCallback) {
      this.onFolderExpandCallback(path, expanded, content);
      console.log(`[ResourceTrigger] Playing folder ${expanded ? 'expand' : 'collapse'}: ${path}${content ? ` with ${content.length} items` : ''}`);
    } else {
      console.warn(`[ResourceTrigger] No folder expand callback registered for: ${path}`);
    }
  }

  /**
   * Trigger file/folder creation during playback
   */
  playCreate(path: string, type: 'f' | 'd'): void {
    if (this.onCreateCallback) {
      this.onCreateCallback(path, type);
      console.log(`[ResourceTrigger] Playing ${type === 'f' ? 'file' : 'folder'} create: ${path}`);
    } else {
      console.warn(`[ResourceTrigger] No create callback registered for: ${path}`);
    }
  }

  /**
   * Trigger file/folder deletion during playback
   */
  playDelete(path: string): void {
    if (this.onDeleteCallback) {
      this.onDeleteCallback(path);
      console.log(`[ResourceTrigger] Playing delete: ${path}`);
    } else {
      console.warn(`[ResourceTrigger] No delete callback registered for: ${path}`);
    }
  }

  /**
   * Trigger file/folder move during playback
   */
  playMove(from: string, to: string): void {
    if (this.onMoveCallback) {
      this.onMoveCallback(from, to);
      console.log(`[ResourceTrigger] Playing move: ${from} -> ${to}`);
    } else {
      console.warn(`[ResourceTrigger] No move callback registered for: ${from}`);
    }
  }

  /**
   * Trigger create input show during playback
   */
  playCreateInputShow(type: 'file' | 'folder', parentPath: string): void {
    if (this.onCreateInputShowCallback) {
      this.onCreateInputShowCallback(type, parentPath);
      console.log(`[ResourceTrigger] Playing create input show: ${type} in ${parentPath}`);
    } else {
      console.warn(`[ResourceTrigger] No create input show callback registered`);
    }
  }

  /**
   * Trigger create input type during playback
   */
  playCreateInputType(text: string): void {
    if (this.onCreateInputTypeCallback) {
      this.onCreateInputTypeCallback(text);
      console.log(`[ResourceTrigger] Playing create input type: "${text}"`);
    } else {
      console.warn(`[ResourceTrigger] No create input type callback registered`);
    }
  }

  /**
   * Trigger create input hide during playback
   */
  playCreateInputHide(cancelled: boolean): void {
    if (this.onCreateInputHideCallback) {
      this.onCreateInputHideCallback(cancelled);
      console.log(`[ResourceTrigger] Playing create input hide: ${cancelled ? 'cancelled' : 'submitted'}`);
    } else {
      console.warn(`[ResourceTrigger] No create input hide callback registered`);
    }
  }

  /**
   * Trigger rename input show during playback
   */
  playRenameInputShow(path: string, currentName: string): void {
    if (this.onRenameInputShowCallback) {
      this.onRenameInputShowCallback(path, currentName);
      console.log(`[ResourceTrigger] Playing rename input show: ${path} (${currentName})`);
    } else {
      console.warn(`[ResourceTrigger] No rename input show callback registered`);
    }
  }

  /**
   * Trigger rename input type during playback
   */
  playRenameInputType(text: string): void {
    if (this.onRenameInputTypeCallback) {
      this.onRenameInputTypeCallback(text);
      console.log(`[ResourceTrigger] Playing rename input type: "${text}"`);
    } else {
      console.warn(`[ResourceTrigger] No rename input type callback registered`);
    }
  }

  /**
   * Trigger rename input hide during playback
   */
  playRenameInputHide(cancelled: boolean): void {
    if (this.onRenameInputHideCallback) {
      this.onRenameInputHideCallback(cancelled);
      console.log(`[ResourceTrigger] Playing rename input hide: ${cancelled ? 'cancelled' : 'submitted'}`);
    } else {
      console.warn(`[ResourceTrigger] No rename input hide callback registered`);
    }
  }

  /**
   * Trigger popover show during playback
   */
  playPopoverShow(path: string): void {
    if (this.onPopoverShowCallback) {
      this.onPopoverShowCallback(path);
      console.log(`[ResourceTrigger] Playing popover show: ${path}`);
    } else {
      console.warn(`[ResourceTrigger] No popover show callback registered`);
    }
  }

  /**
   * Trigger popover hide during playback
   */
  playPopoverHide(path: string): void {
    if (this.onPopoverHideCallback) {
      this.onPopoverHideCallback(path);
      console.log(`[ResourceTrigger] Playing popover hide: ${path}`);
    } else {
      console.warn(`[ResourceTrigger] No popover hide callback registered`);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.onFolderExpandCallback = null;
    this.onCreateCallback = null;
    this.onDeleteCallback = null;
    this.onMoveCallback = null;
    this.onCreateInputShowCallback = null;
    this.onCreateInputTypeCallback = null;
    this.onCreateInputHideCallback = null;
    this.onRenameInputShowCallback = null;
    this.onRenameInputTypeCallback = null;
    this.onRenameInputHideCallback = null;
    this.onPopoverShowCallback = null;
    this.onPopoverHideCallback = null;
    console.log('[ResourceTrigger] Destroyed');
  }
}
