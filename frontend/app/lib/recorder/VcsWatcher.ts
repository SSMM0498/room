/**
 * VcsWatcher - Records Git version control operations
 *
 * Listens to workspace:commit events from the Worker and records them
 * as state:vcs events in the action log. These events capture the commit
 * hash which serves as the ground truth for workspace state.
 */

import { EventTypes } from '~/types/events';
import type { VcsPayload } from '~/types/events';

type AddEventCallback = <P>(src: string, act: string, payload: P, timestamp?: number) => void;

export class VcsWatcher {
  private addEvent: AddEventCallback;
  private latestCommitHash: string = '';

  constructor(addEvent: AddEventCallback) {
    this.addEvent = addEvent;
  }

  /**
   * Record a Git commit event
   * Called when a workspace:commit event is received from the Worker
   * @param hash - The Git commit hash
   * @param message - The commit message
   */
  recordCommit(hash: string, message: string): void {
    // Track the latest commit hash
    this.latestCommitHash = hash;

    this.addEvent<VcsPayload>('state', EventTypes.STATE_VCS, {
      hash,
      message,
    });
    console.log(`[VcsWatcher] Commit recorded: ${hash.substring(0, 8)} - ${message}`);
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
  setInitialCommitHash(hash: string): void {
    this.latestCommitHash = hash;
    console.log(`[VcsWatcher] Initial commit hash set: ${hash.substring(0, 8)}`);
  }
}