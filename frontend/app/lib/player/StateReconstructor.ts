/**
 * State Reconstructor
 *
 * Reconstructs the ground truth state at any point in time by finding the
 * nearest full snapshot and applying deltas forward.
 * Also applies the reconstructed state to the UI players.
 */

import type {
  AnyActionPacket,
  SnapshotPayload,
  UIState,
  WorkspaceState,
  FullFileState,
  DeltaFileState,
} from '~/types/events';
import { isFullSnapshot, isDeltaSnapshot, isStateCommit } from '~/types/events';
import type { CursorMovementPlayer } from './CursorMovementPlayer';
import type { IdeTabPlayer } from './IdeTabPlayer';

export class StateReconstructor {
  private groundTruthState: {
    ui: UIState | null;
    workspace: WorkspaceState | null;
  } = {
      ui: null,
      workspace: null,
    };

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
   * Reconstruct the ground truth state at a specific time
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

    // Step 2: Load the base snapshot as ground truth
    const snapshotPayload = baseSnapshot.p as SnapshotPayload;
    this.groundTruthState = {
      ui: snapshotPayload.ui,
      workspace: this.cloneWorkspaceState(snapshotPayload.workspace),
    };

    // Step 3: Apply all delta snapshots and state commits from base to target
    for (let i = baseSnapshotIndex + 1; i < timeline.length; i++) {
      const event = timeline[i];

      if (event) {
        if (event.t > absoluteTargetTime) {
          break;
        }

        if (isDeltaSnapshot(event)) {
          this.applyDeltaSnapshot(event.p as SnapshotPayload);
        } else if (isStateCommit(event)) {
          this.applyStateCommit(event.p as { file: string; content: string });
        }
      }
    }

    console.log('[StateReconstructor] Ground truth state reconstructed at', targetTime / 1000, 'seconds (relative)');
  }

  /**
   * Apply a delta snapshot to the ground truth state
   */
  private applyDeltaSnapshot(delta: SnapshotPayload): void {
    if (!this.groundTruthState.workspace) return;

    const fileDelta = delta.workspace.files as DeltaFileState;
    const currentFiles = this.groundTruthState.workspace.files as FullFileState;

    // Apply updated files
    for (const [path, content] of Object.entries(fileDelta.updated)) {
      currentFiles[path] = content;
    }

    // Apply deleted files
    for (const path of fileDelta.deleted) {
      delete currentFiles[path];
    }

    // Update terminals and processes
    this.groundTruthState.workspace.terminals = delta.workspace.terminals;
    this.groundTruthState.workspace.processes = delta.workspace.processes;

    // Update UI state
    this.groundTruthState.ui = delta.ui;
  }

  /**
   * Apply a state commit to the ground truth state
   */
  private applyStateCommit(commit: { file: string; content: string }): void {
    if (!this.groundTruthState.workspace) return;

    const files = this.groundTruthState.workspace.files as FullFileState;
    files[commit.file] = commit.content;
  }

  /**
   * Clone workspace state for immutability
   */
  private cloneWorkspaceState(state: WorkspaceState): WorkspaceState {
    return {
      files: { ...(state.files as FullFileState) },
      terminals: { ...state.terminals },
      processes: [...state.processes],
    };
  }

  /**
   * Apply the reconstructed ground truth state to the UI players
   */
  applyReconstructedStateToUI(): void {
    const { ui, workspace } = this.groundTruthState;

    if (!ui) {
      console.warn('[StateReconstructor] No UI state to apply');
      return;
    }

    // Apply mouse position
    if (ui.mouse && this.cursorPlayer) {
      this.cursorPlayer.setPosition(ui.mouse.x, ui.mouse.y);
      console.log(`[StateReconstructor] Applied mouse position: (${ui.mouse.x}, ${ui.mouse.y})`);
    }

    // Apply tab state
    if (ui.ide?.tabs?.editor && workspace && this.ideTabPlayer) {
      this.ideTabPlayer.applyTabSnapshot(
        ui.ide.tabs.editor,
        (workspace.files as Record<string, string>) || {}
      );
      console.log(`[StateReconstructor] Applied tab state: ${ui.ide.tabs.editor.openFiles.length} tabs, active: ${ui.ide.tabs.editor.activeFile}`);
    }

    // Apply file tree state
    if (ui.fileTree && this.fileTreeRestoreCallback) {
      this.fileTreeRestoreCallback(
        ui.fileTree.expandedPaths,
        ui.fileTree.tree
      );
      console.log(`[StateReconstructor] Applied file tree state: ${ui.fileTree.expandedPaths.length} expanded paths`);
    }
  }

  /**
   * Get the current ground truth state
   */
  getGroundTruthState(): { ui: UIState | null; workspace: WorkspaceState | null } {
    return this.groundTruthState;
  }

  /**
   * Reset the state
   */
  reset(): void {
    this.groundTruthState = {
      ui: null,
      workspace: null,
    };
  }
}
