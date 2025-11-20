/**
 * CommitHashTracker - Tracks Git commit hashes and triggers snapshots
 *
 * Listens to workspace:commit events from the Worker and:
 * 1. Tracks the latest commit hash (used by full snapshots)
 * 2. Triggers delta snapshots on every commit (event-driven state capture)
 *
 * This ensures delta snapshots are created exactly when the workspace changes,
 * rather than on arbitrary timers.
 */

export class CommitHashTracker {
  private latestCommitHash: string = '';
  private onCommit: (hash: string) => void;

  constructor(onCommit: (hash: string) => void) {
    this.onCommit = onCommit;
  }

  /**
   * Record a Git commit event
   * Called when a workspace:commit event is received from the Worker
   * @param hash - The Git commit hash
   * @param message - The commit message
   */
  recordCommit(hash: string, message: string): void {
    // Track the latest commit hash
    this.setCommitHash(hash);

    // Trigger delta snapshot immediately when commit happens
    // This captures state exactly when workspace changes
    this.onCommit(hash);

    console.log(`[CommitHashTracker] Commit tracked: ${hash.substring(0, 8)} - ${message}`);
  }

  /**
   * Get the latest commit hash
   * Used when creating snapshots to include the current workspace state
   */
  getLatestCommitHash(): string {
    return this.latestCommitHash;
  }

  /**
   * Set the initial commit hash
   * Called when recording starts with an existing repository
   */
  setCommitHash(hash: string): void {
    this.latestCommitHash = hash;
  }
}
