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

    // Calculate UI delta
    const uiDelta = this.calculateUIStateDelta(this.lastSnapshotState.ui, currentUIState);

    // Only create delta if there are actual changes
    if (!this.hasUIChanges(uiDelta)) {
      return null;
    }

    // Warn if commit hash is empty - this may cause playback failures
    if (commitHash === '') {
      console.warn('[SnapshotManager] Creating delta snapshot with empty commit hash - playback may fail');
    }

    const deltaPayload: SnapshotPayload = {
      ui: uiDelta,
      workspace: {
        commitHash: commitHash
      }
    };

    // Update last snapshot state to current state
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
   */
  private calculateUIStateDelta(oldState: UIState, newState: UIState): UIState {
    // For now, return full UI state in delta
    // TODO: Implement proper delta calculation for UI state
    return newState;
  }

  /**
   * Check if there are any changes in the UI delta
   */
  private hasUIChanges(uiDelta: UIState): boolean {
    // Since we're currently returning full UI state in delta,
    // always return true if we have a delta
    // TODO: Implement proper change detection when delta calculation is implemented
    return true;
  }
}
