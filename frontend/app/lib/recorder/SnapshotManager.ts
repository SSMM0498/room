/**
 * Snapshot Manager
 *
 * Handles the creation and management of full and delta snapshots.
 */

import type {
  SnapshotPayload,
  UIState,
  WorkspaceState,
  FullFileState,
  DeltaFileState,
} from '~/types/events';

export class SnapshotManager {
  private lastSnapshotState: SnapshotPayload | null = null;

  /**
   * Create a full snapshot payload
   */
  createFullSnapshot(uiState: UIState, workspaceState: WorkspaceState): SnapshotPayload {
    const snapshot: SnapshotPayload = {
      ui: uiState,
      workspace: workspaceState,
    };

    // Store for delta comparison
    this.lastSnapshotState = snapshot;

    return snapshot;
  }

  /**
   * Create a delta snapshot payload (only changes since last snapshot)
   */
  createDeltaSnapshot(
    currentUIState: UIState,
    currentWorkspaceState: WorkspaceState
  ): SnapshotPayload | null {
    if (!this.lastSnapshotState) {
      return null; // No baseline to compare against
    }

    // Calculate UI delta
    const uiDelta = this.calculateUIStateDelta(this.lastSnapshotState.ui, currentUIState);

    // Calculate workspace delta
    const workspaceDelta = this.calculateWorkspaceStateDelta(
      this.lastSnapshotState.workspace,
      currentWorkspaceState
    );

    // Only create delta if there are actual changes
    if (!this.hasChanges(uiDelta, workspaceDelta)) {
      return null;
    }

    const deltaPayload: SnapshotPayload = {
      ui: uiDelta,
      workspace: workspaceDelta,
    };

    // Update last snapshot state to current state
    this.lastSnapshotState = {
      ui: currentUIState,
      workspace: currentWorkspaceState,
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
   */
  private calculateUIStateDelta(oldState: UIState, newState: UIState): UIState {
    // For now, return full UI state in delta
    // TODO: Implement proper delta calculation for UI state
    return newState;
  }

  /**
   * Calculate the delta between two workspace states
   */
  private calculateWorkspaceStateDelta(
    oldState: WorkspaceState,
    newState: WorkspaceState
  ): WorkspaceState {
    // Calculate file deltas
    const oldFiles = oldState.files as FullFileState;
    const newFiles = newState.files as FullFileState;

    const updated: { [path: string]: string } = {};
    const deleted: string[] = [];

    // Find updated/created files
    for (const [path, content] of Object.entries(newFiles)) {
      if (oldFiles[path] !== content) {
        updated[path] = content;
      }
    }

    // Find deleted files
    for (const path of Object.keys(oldFiles)) {
      if (!(path in newFiles)) {
        deleted.push(path);
      }
    }

    const fileDelta: DeltaFileState = { updated, deleted };

    return {
      files: fileDelta,
      terminals: newState.terminals,
      processes: newState.processes,
    };
  }

  /**
   * Check if there are any changes in the delta
   */
  private hasChanges(uiDelta: UIState, workspaceDelta: WorkspaceState): boolean {
    const fileDelta = workspaceDelta.files as DeltaFileState;
    return (
      Object.keys(fileDelta.updated).length > 0 ||
      fileDelta.deleted.length > 0 ||
      Object.keys(workspaceDelta.terminals).length > 0 ||
      workspaceDelta.processes.length > 0
    );
  }
}
