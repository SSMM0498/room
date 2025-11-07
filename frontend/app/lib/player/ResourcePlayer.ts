/**
 * ResourcePlayer - Plays back file system operations
 *
 * Components register callbacks that will be invoked during playback:
 * - onFolderExpand: Expands or collapses a folder
 * - onCreate: Creates a new file or folder
 * - onDelete: Deletes a file or folder
 * - onMove: Renames or moves a file or folder
 */

export class ResourcePlayer {
  private onFolderExpandCallback: ((
    path: string,
    expanded: boolean,
    content?: Array<{ name: string; path: string; type: 'file' | 'directory' }>
  ) => void) | null = null;
  private onCreateCallback: ((path: string, type: 'f' | 'd') => void) | null = null;
  private onDeleteCallback: ((path: string) => void) | null = null;
  private onMoveCallback: ((from: string, to: string) => void) | null = null;

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
    console.log('[ResourcePlayer] Folder expand callback registered');
  }

  /**
   * Register callback for file/folder creation events
   * Called by file-explorer component
   */
  setOnCreate(callback: (path: string, type: 'f' | 'd') => void): void {
    this.onCreateCallback = callback;
    console.log('[ResourcePlayer] Create callback registered');
  }

  /**
   * Register callback for file/folder deletion events
   * Called by file-explorer component
   */
  setOnDelete(callback: (path: string) => void): void {
    this.onDeleteCallback = callback;
    console.log('[ResourcePlayer] Delete callback registered');
  }

  /**
   * Register callback for file/folder move/rename events
   * Called by file-explorer component
   */
  setOnMove(callback: (from: string, to: string) => void): void {
    this.onMoveCallback = callback;
    console.log('[ResourcePlayer] Move callback registered');
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
      console.log(`[ResourcePlayer] Playing folder ${expanded ? 'expand' : 'collapse'}: ${path}${content ? ` with ${content.length} items` : ''}`);
    } else {
      console.warn(`[ResourcePlayer] No folder expand callback registered for: ${path}`);
    }
  }

  /**
   * Trigger file/folder creation during playback
   */
  playCreate(path: string, type: 'f' | 'd'): void {
    if (this.onCreateCallback) {
      this.onCreateCallback(path, type);
      console.log(`[ResourcePlayer] Playing ${type === 'f' ? 'file' : 'folder'} create: ${path}`);
    } else {
      console.warn(`[ResourcePlayer] No create callback registered for: ${path}`);
    }
  }

  /**
   * Trigger file/folder deletion during playback
   */
  playDelete(path: string): void {
    if (this.onDeleteCallback) {
      this.onDeleteCallback(path);
      console.log(`[ResourcePlayer] Playing delete: ${path}`);
    } else {
      console.warn(`[ResourcePlayer] No delete callback registered for: ${path}`);
    }
  }

  /**
   * Trigger file/folder move during playback
   */
  playMove(from: string, to: string): void {
    if (this.onMoveCallback) {
      this.onMoveCallback(from, to);
      console.log(`[ResourcePlayer] Playing move: ${from} -> ${to}`);
    } else {
      console.warn(`[ResourcePlayer] No move callback registered for: ${from}`);
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
    console.log('[ResourcePlayer] Destroyed');
  }
}
