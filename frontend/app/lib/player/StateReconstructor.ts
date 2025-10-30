/**
 * State Reconstructor
 *
 * Reconstructs the ground truth state at any point in time by finding the
 * nearest full snapshot and applying deltas forward.
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

export class StateReconstructor {
  private groundTruthState: {
    ui: UIState | null;
    workspace: WorkspaceState | null;
  } = {
      ui: null,
      workspace: null,
    };

  /**
   * Reconstruct the ground truth state at a specific time
   */
  async reconstructStateAtTime(timeline: AnyActionPacket[], targetTime: number): Promise<void> {
    // Step 1: Find the most recent full snapshot before target time
    let baseSnapshot: AnyActionPacket | null = null;
    let baseSnapshotIndex = -1;

    for (let i = timeline.length - 1; i >= 0; i--) {
      const event = timeline[i];
      if (event && event.t <= targetTime && isFullSnapshot(event)) {
        baseSnapshot = event;
        baseSnapshotIndex = i;
        break;
      }
    }

    if (!baseSnapshot) {
      throw new Error('No full snapshot found before target time');
    }

    console.log('[StateReconstructor] Found base snapshot at', baseSnapshot.t / 1000, 'seconds');

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
        if (event.t > targetTime) {
          break;
        }

        if (isDeltaSnapshot(event)) {
          this.applyDeltaSnapshot(event.p as SnapshotPayload);
        } else if (isStateCommit(event)) {
          this.applyStateCommit(event.p as { file: string; content: string });
        }
      }
    }

    console.log('[StateReconstructor] Ground truth state reconstructed at', targetTime / 1000, 'seconds');
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
