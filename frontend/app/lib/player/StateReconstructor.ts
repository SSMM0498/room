/**
 * State Reconstructor
 *
 * Reconstructs the UI state at any point in time by finding the
 * nearest full snapshot and applying deltas forward.
 *
 * NOTE: After Git-based state management, workspace state (files/folders) is
 * reconstructed by Git checkout, not by snapshots. This class only handles UI state.
 */

import type {
  AnyActionPacket,
  SnapshotPayload,
  UIState,
} from '~/types/events';
import { isFullSnapshot, isDeltaSnapshot } from '~/types/events';
import type { CursorMovementPlayer } from './CursorMovementPlayer';
import type { IdeTabPlayer } from './IdeTabPlayer';

export class StateReconstructor {
  private uiState: UIState | null = null;
  private commitHash: string | null = null; // Current commit hash from snapshot

  // References to UI players for applying state
  private cursorPlayer: CursorMovementPlayer | null = null;
  private ideTabPlayer: IdeTabPlayer | null = null;
  private fileTreeRestoreCallback: ((expandedPaths: string[], tree: any | null) => void) | null = null;

  /**
   * Set references to UI players for state application
   */
  setUIPlayers(
    cursorPlayer: CursorMovementPlayer,
    ideTabPlayer: IdeTabPlayer,
    fileTreeRestoreCallback: (expandedPaths: string[], tree: any | null) => void
  ): void {
    this.cursorPlayer = cursorPlayer;
    this.ideTabPlayer = ideTabPlayer;
    this.fileTreeRestoreCallback = fileTreeRestoreCallback;
  }

  /**
   * Set full snapshot - replaces entire current state
   * Called when full snapshot event is encountered during playback
   * NOTE: State is stored internally, NOT applied to UI
   */
  setFullSnapshot(snapshot: SnapshotPayload): void {
    this.uiState = snapshot.ui as UIState;
    this.commitHash = snapshot.workspace.commitHash;
    console.log('[StateReconstructor] Set full snapshot with commit:', this.commitHash?.substring(0, 8));
  }

  /**
   * Apply delta snapshot - merges changes into current state
   * Called when delta snapshot event is encountered during playback
   * NOTE: State is stored internally, NOT applied to UI
   */
  applyDelta(delta: SnapshotPayload): void {
    this.applyDeltaSnapshot(delta);
    console.log('[StateReconstructor] Applied delta snapshot, commit:', this.commitHash?.substring(0, 8));
  }

  /**
   * Reconstruct the UI state at a specific time
   * NOTE: Workspace state (files/folders) is reconstructed separately via Git checkout
   */
  async reconstructStateAtTime(timeline: AnyActionPacket[], targetTime: number): Promise<void> {
    // Get the start time from the first event to convert relative time to absolute
    const startTime = timeline[0]?.t ?? 0;
    const absoluteTargetTime = startTime + targetTime;

    console.log('[StateReconstructor] Converting relative time', targetTime / 1000, 'seconds to absolute', absoluteTargetTime);

    // Step 1: Find the most recent full snapshot before target time
    let baseSnapshot: AnyActionPacket | null = null;
    let baseSnapshotIndex = -1;

    for (let i = timeline.length - 1; i >= 0; i--) {
      const event = timeline[i];
      if (event && event.t <= absoluteTargetTime && isFullSnapshot(event)) {
        baseSnapshot = event;
        baseSnapshotIndex = i;
        break;
      }
    }

    if (!baseSnapshot) {
      throw new Error('No full snapshot found before target time');
    }

    console.log('[StateReconstructor] Found base snapshot at', (baseSnapshot.t - startTime) / 1000, 'seconds (relative)');

    // Step 2: Load the base snapshot as UI state and commit hash
    const snapshotPayload = baseSnapshot.p as SnapshotPayload;
    // Full snapshots contain complete UIState, cast to UIState to ensure type safety
    this.uiState = snapshotPayload.ui as UIState;
    this.commitHash = snapshotPayload.workspace.commitHash;

    // Step 3: Apply all delta snapshots from base to target
    for (let i = baseSnapshotIndex + 1; i < timeline.length; i++) {
      const event = timeline[i];

      if (event) {
        if (event.t > absoluteTargetTime) {
          break;
        }

        if (isDeltaSnapshot(event)) {
          this.applyDeltaSnapshot(event.p as SnapshotPayload);
        }
      }
    }

    console.log('[StateReconstructor] UI state reconstructed at', targetTime / 1000, 'seconds (relative) with commit:', this.commitHash?.substring(0, 8));
  }

  /**
   * Apply a delta snapshot to the UI state
   * Merges only the changed fields from the delta into the current state
   * NOTE: Workspace state is no longer updated via snapshots (handled by Git)
   */
  private applyDeltaSnapshot(delta: SnapshotPayload): void {
    if (!this.uiState) {
      console.warn('[StateReconstructor] No base UI state to apply delta to');
      return;
    }

    // Delta contains only changed fields (Partial<UIState>)
    // Merge each field conditionally
    if (delta.ui.mouse) {
      this.uiState.mouse = delta.ui.mouse;
    }

    if (delta.ui.scrolls) {
      this.uiState.scrolls = delta.ui.scrolls;
    }

    if (delta.ui.ide) {
      this.uiState.ide = delta.ui.ide;
    }

    if (delta.ui.fileTree) {
      // Update expandedPaths from delta
      this.uiState.fileTree.expandedPaths = delta.ui.fileTree.expandedPaths;

      // Only update tree if present in delta (null in delta snapshots, full tree in full snapshots)
      if (delta.ui.fileTree.tree !== null) {
        this.uiState.fileTree.tree = delta.ui.fileTree.tree;
      }
      // If tree is null in delta, keep existing tree (deltas skip tree to reduce size)
    }

    if (delta.ui.browser) {
      this.uiState.browser = delta.ui.browser;
    }

    // Always update commit hash (present in both full and delta snapshots)
    this.commitHash = delta.workspace.commitHash;
  }

  /**
   * Apply the reconstructed UI state to the UI players
   * NOTE: File contents for tabs are read from the Worker filesystem (restored via Git),
   * not from snapshots
   */
  applyReconstructedStateToUI(): void {
    if (!this.uiState) {
      console.warn('[StateReconstructor] No UI state to apply');
      return;
    }

    // Apply mouse position
    if (this.uiState.mouse && this.cursorPlayer) {
      this.cursorPlayer.setPosition(this.uiState.mouse.x, this.uiState.mouse.y);
      console.log(`[StateReconstructor] Applied mouse position: (${this.uiState.mouse.x}, ${this.uiState.mouse.y})`);
    }

    // Apply tab state
    // NOTE: File contents will be read from Worker filesystem (restored via Git checkout)
    if (this.uiState.ide?.tabs?.editor && this.ideTabPlayer) {
      this.ideTabPlayer.applyTabSnapshot(
        this.uiState.ide.tabs.editor,
      );
      console.log(`[StateReconstructor] Applied tab state: ${this.uiState.ide.tabs.editor.openFiles.length} tabs, active: ${this.uiState.ide.tabs.editor.activeFile}`);
    }

    // Apply file tree state
    if (this.uiState.fileTree && this.fileTreeRestoreCallback) {
      this.fileTreeRestoreCallback(
        this.uiState.fileTree.expandedPaths,
        this.uiState.fileTree.tree
      );
      console.log(`[StateReconstructor] Applied file tree state: ${this.uiState.fileTree.expandedPaths.length} expanded paths`);
    }
  }

  /**
   * Get the current UI state
   */
  getUIState(): UIState | null {
    return this.uiState;
  }

  /**
   * Get the current commit hash from the reconstructed snapshot
   */
  getCommitHash(): string | null {
    return this.commitHash;
  }

  /**
   * Reset the state
   */
  reset(): void {
    this.uiState = null;
    this.commitHash = null;
  }
}
