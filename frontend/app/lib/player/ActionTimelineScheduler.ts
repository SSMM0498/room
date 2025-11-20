/**
 * Action Timeline Scheduler
 *
 * RAF-based scheduler that executes actions at precise times.
 * Based on the proven architecture from the old Player core.
 */

export interface ActionWithDelay {
  triggerAction: () => void;
  delay: number; // Absolute time when this action should execute
}

export class ActionTimelineScheduler {
  public timeOffset: number = 0;

  private actionsBuffer: ActionWithDelay[] = [];
  private raf: number | null = null;
  private liveMode: boolean = false;

  /**
   * Add all actions before the timer starts
   */
  public addActions(actions: ActionWithDelay[]): void {
    this.actionsBuffer.push(...actions);
  }

  /**
   * Start the scheduler
   */
  public start(): void {
    // TODO: Need detailled explanation of the scheduler mechanism
    this.actionsBuffer.sort((a1, a2) => a1.delay - a2.delay);
    this.timeOffset = 0;
    let lastTimestamp = performance.now();
    const { actionsBuffer: actions } = this;
    const self = this;

    function triggerAllActions(time: number) {
      self.timeOffset += time - lastTimestamp;
      lastTimestamp = time;

      while (actions.length) {
        const action = actions[0];
        if (!action) break;

        if (self.timeOffset >= action.delay) {
          actions.shift();
          action.triggerAction();
        } else {
          break;
        }
      }

      if (actions.length > 0 || self.liveMode) {
        self.raf = requestAnimationFrame(triggerAllActions);
      }
    }

    this.raf = requestAnimationFrame(triggerAllActions);
  }

  /**
   * Pause the scheduler
   */
  public pause(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
  }

  /**
   * Resume the scheduler
   */
  public resume(): void {
    if (this.raf) {
      // Already running
      return;
    }

    let lastTimestamp = performance.now();
    const { actionsBuffer: actions } = this;
    const self = this;

    function check(time: number) {
      self.timeOffset += time - lastTimestamp;
      lastTimestamp = time;

      while (actions.length) {
        const action = actions[0];
        if (!action) break;

        if (self.timeOffset >= action.delay) {
          actions.shift();
          action.triggerAction();
        } else {
          break;
        }
      }

      if (actions.length > 0 || self.liveMode) {
        self.raf = requestAnimationFrame(check);
      }
    }

    this.raf = requestAnimationFrame(check);
  }

  /**
   * Clear all scheduled actions
   */
  public clear(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = null;
    }
    this.actionsBuffer.length = 0;
  }

  /**
   * Check if scheduler is active
   */
  public isActive(): boolean {
    return this.raf !== null;
  }

  /**
   * Get current playback time (same as timeOffset)
   */
  public getCurrentTime(): number {
    return this.timeOffset;
  }

  /**
   * Set the time offset (for seeking)
   */
  public setTimeOffset(time: number): void {
    this.timeOffset = time;
  }

  /**
   * Toggle live mode
   */
  public toggleLiveMode(mode: boolean): void {
    this.liveMode = mode;
  }

  /**
   * Find the correct index to insert an action (binary search)
   */
  private findActionIndex(action: ActionWithDelay): number {
    let start = 0;
    let end = this.actionsBuffer.length - 1;

    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const midAction = this.actionsBuffer[mid];
      if (!midAction) break;

      if (midAction.delay < action.delay) {
        start = mid + 1;
      } else if (midAction.delay > action.delay) {
        end = mid - 1;
      } else {
        return mid;
      }
    }
    return start;
  }
}
