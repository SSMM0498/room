/**
 * Snapshot Manager
 *
 * Handles the creation and management of full and delta snapshots.
 *
 * NOTE: After Git-based state management, snapshots contain UI state + commit hash.
 * The commit hash is used to restore the exact workspace state during playback.
 */

import type {
  SnapshotPayload,
  UIState,
  IDEState,
  FileTreeState,
  ScrollState,
  ComponentId,
} from '~/types/events';

export class SnapshotManager {
  private lastSnapshotState: SnapshotPayload | null = null;

  /**
   * Create a full snapshot payload (UI state + commit hash)
   */
  createFullSnapshot(uiState: UIState, commitHash: string): SnapshotPayload {
    // Warn if commit hash is empty - this may cause playback failures
    if (commitHash === '') {
      console.warn('[SnapshotManager] Creating full snapshot with empty commit hash - playback may fail');
    }

    const snapshot: SnapshotPayload = {
      ui: uiState,
      workspace: {
        commitHash: commitHash
      }
    };

    // Store for delta comparison
    this.lastSnapshotState = snapshot;

    return snapshot;
  }

  /**
   * Create a delta snapshot payload (only UI changes since last snapshot + commit hash)
   */
  createDeltaSnapshot(
    currentUIState: UIState,
    commitHash: string
  ): SnapshotPayload | null {
    if (!this.lastSnapshotState) {
      return null; // No baseline to compare against
    }

    const uiDelta = this.calculateUIStateDelta(this.lastSnapshotState.ui as UIState, currentUIState);

    if (!this.hasUIChanges(uiDelta)) {
      return null;
    }

    if (commitHash === '') {
      console.warn('[SnapshotManager] Creating delta snapshot with empty commit hash - playback may fail');
    }

    const deltaPayload: SnapshotPayload = {
      ui: uiDelta,
      workspace: {
        commitHash: commitHash
      }
    };

    this.lastSnapshotState = {
      ui: currentUIState,
      workspace: {
        commitHash: commitHash
      }
    };

    return deltaPayload;
  }

  /**
   * Reset the snapshot manager
   */
  reset(): void {
    this.lastSnapshotState = null;
  }

  /**
   * Calculate the delta between two UI states
   * Returns only the fields that have changed
   */
  private calculateUIStateDelta(oldState: UIState, newState: UIState): Partial<UIState> {
    const delta: Partial<UIState> = {};

    // Mouse: include if position changed (high frequency)
    if (oldState.mouse.x !== newState.mouse.x || oldState.mouse.y !== newState.mouse.y) {
      delta.mouse = newState.mouse;
    }

    // Scrolls: include if any scroll position changed
    if (!this.areScrollsEqual(oldState.scrolls, newState.scrolls)) {
      delta.scrolls = newState.scrolls;
    }

    // IDE state: compare nested structure
    const ideDelta = this.calculateIDEStateDelta(oldState.ide, newState.ide);
    if (ideDelta) {
      delta.ide = ideDelta;
    }

    // FileTree: compare expandedPaths (skip tree in deltas - too large)
    const fileTreeDelta = this.calculateFileTreeDelta(oldState.fileTree, newState.fileTree);
    if (fileTreeDelta) {
      delta.fileTree = fileTreeDelta;
    }

    // Browser: simple comparison
    if (oldState.browser.url !== newState.browser.url) {
      delta.browser = newState.browser;
    }

    return delta;
  }

  /**
   * Check if there are any changes in the UI delta
   */
  private hasUIChanges(uiDelta: Partial<UIState>): boolean {
    return Object.keys(uiDelta).length > 0;
  }

  /**
   * Compare two string arrays for equality
   */
  private areArraysEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((val, idx) => val === b[idx]);
  }

  /**
   * Compare two scroll states for equality
   */
  private areScrollsEqual(a: ScrollState, b: ScrollState): boolean {
    const aKeys = Object.keys(a!) as ComponentId[];
    const bKeys = Object.keys(b!) as ComponentId[];

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    return aKeys.every((key) => {
      const bScroll = b!.get(key);
      const aScroll = a!.get(key);
      if (!aScroll || !bScroll) {
        return false;
      }
      return aScroll.top === bScroll.top && aScroll.left === bScroll.left;
    });
  }

  /**
   * Calculate delta for IDE state
   * Returns full IDE state if any changes detected, null otherwise
   */
  private calculateIDEStateDelta(oldState: IDEState, newState: IDEState): IDEState | null {
    // Check if active panel changed
    const panelChanged = oldState.activePanel !== newState.activePanel;

    // Check if editor tabs changed
    const editorTabsChanged =
      !this.areArraysEqual(oldState.tabs.editor.openFiles, newState.tabs.editor.openFiles) ||
      oldState.tabs.editor.activeFile !== newState.tabs.editor.activeFile;

    // Check if terminal tabs changed
    const terminalTabsChanged =
      !this.areArraysEqual(oldState.tabs.terminal.openTerminals, newState.tabs.terminal.openTerminals) ||
      oldState.tabs.terminal.activeTerminal !== newState.tabs.terminal.activeTerminal;

    // If any change detected, return full IDE state
    if (panelChanged || editorTabsChanged || terminalTabsChanged) {
      return newState;
    }

    return null;
  }

  /**
   * Calculate delta for file tree state
   * Only includes expandedPaths (tree is too large for deltas)
   */
  private calculateFileTreeDelta(oldState: FileTreeState, newState: FileTreeState): FileTreeState | null {
    const expandedPathsChanged = !this.areArraysEqual(
      oldState.expandedPaths,
      newState.expandedPaths
    );

    if (expandedPathsChanged) {
      // Only include expandedPaths in delta, set tree to null
      // Full tree will be included in full snapshots only
      return {
        expandedPaths: newState.expandedPaths,
        tree: null  // Skip tree in deltas (too large)
      };
    }

    return null;
  }
}
