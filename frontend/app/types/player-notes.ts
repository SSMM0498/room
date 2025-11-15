/**
 * Player Note Type Definition
 *
 * Notes represent interactive pause points where the user paused playback,
 * made changes on a separate Git branch, and saved those changes for later reference.
 */

export interface PlayerNote {
  /** Unique identifier for the note */
  id: string;

  /** Recording timestamp (in ms) when the note was created (when user paused) */
  timestamp: number;

  /** Git branch name containing the user's changes */
  branchName: string;

  /** Latest commit hash on the branch */
  commitHash: string;

  /** Optional user-provided description of the note */
  description?: string;

  /** Unix timestamp when the note was saved */
  createdAt: number;
}
