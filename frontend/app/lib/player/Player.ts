/**
 * Core Player Class
 *
 * Reads the Action Log and audio file to replay a recorded session.
 * Manages playback state and provides seeking functionality.
 *
 * Based on the old proven architecture where:
 * - Events are converted to actions on load
 * - Scheduler has its own RAF loop
 * - Each mouse position is a separate action
 */

import type { AnyActionPacket, UIState, WorkspaceState, MousePathPayload, MouseClickPayload, MouseStylePayload, IDETabsOpenPayload, IDETabsClosePayload, IDETabsSwitchPayload, SnapshotPayload } from '~/types/events';
import { EventTypes, isFullSnapshot } from '~/types/events';
import { PlayerStateMachine } from './PlayerStateMachine';
import { ActionTimelineScheduler, type ActionWithDelay } from './ActionTimelineScheduler';
import { StateReconstructor } from './StateReconstructor';
import { CursorMovementPlayer } from './CursorMovementPlayer';
import { CursorInteractionPlayer } from './CursorInteractionPlayer';
import { CursorStylePlayer } from './CursorStylePlayer';
import { IdeTabPlayer } from './IdeTabPlayer';
import type { PlayerConfig, PlayerState } from './types';

export class Player {
  private stateMachine: PlayerStateMachine;
  private scheduler: ActionTimelineScheduler;
  private stateReconstructor: StateReconstructor;
  private cursorPlayer: CursorMovementPlayer;
  private clickPlayer: CursorInteractionPlayer;
  private stylePlayer: CursorStylePlayer;
  private ideTabPlayer: IdeTabPlayer;
  private timeline: AnyActionPacket[] = [];
  private baselineTime: number = 0; // First event timestamp
  private duration: number = 0;

  // Audio element reference
  private audioElement: HTMLAudioElement | null = null;

  constructor(config: PlayerConfig = {}) {
    this.stateMachine = new PlayerStateMachine();
    this.scheduler = new ActionTimelineScheduler();
    this.stateReconstructor = new StateReconstructor();
    this.cursorPlayer = new CursorMovementPlayer();
    this.clickPlayer = new CursorInteractionPlayer();
    this.stylePlayer = new CursorStylePlayer();
    this.ideTabPlayer = new IdeTabPlayer();
    this.audioElement = config.audioElement ?? null;

    // Link the style player to the cursor element (after it's created)
    this.setupStylePlayer();
  }

  /**
   * Setup the style player with cursor element reference
   */
  private setupStylePlayer(): void {
    // The cursor element is created in CursorMovementPlayer constructor
    // We need to get a reference to it
    const cursorElement = document.querySelector('.player-mouse') as HTMLElement;
    if (cursorElement) {
      this.stylePlayer.setCursorElement(cursorElement);
    } else {
      // Retry after a short delay if element not ready yet
      setTimeout(() => {
        const el = document.querySelector('.player-mouse') as HTMLElement;
        if (el) {
          this.stylePlayer.setCursorElement(el);
        }
      }, 100);
    }
  }

  /**
   * Set or update the audio element for synchronized playback
   */
  setAudioElement(element: HTMLAudioElement): void {
    this.audioElement = element;
    console.log('[Player] Audio element set/updated');
  }

  /**
   * Get the IDE tab player instance for components to register playback callbacks
   */
  getIdeTabPlayer(): IdeTabPlayer {
    return this.ideTabPlayer;
  }

  /**
   * Load a timeline from NDJSON string
   */
  async loadFromNDJSON(ndjson: string): Promise<void> {
    this.stateMachine.setState('loading');

    try {
      const lines = ndjson.trim().split('\n');
      this.timeline = lines.map(line => JSON.parse(line) as AnyActionPacket);

      if (this.timeline.length === 0) {
        throw new Error('Timeline is empty');
      }

      // Set baseline time and duration
      const firstEvent = this.timeline[0];
      const lastEvent = this.timeline[this.timeline.length - 1];
      this.baselineTime = firstEvent?.t!;
      this.duration = lastEvent?.t! - firstEvent?.t!;

      console.log('[Player] Timeline loaded:', this.timeline.length, 'events');
      console.log('[Player] Duration:', this.duration / 1000, 'seconds');

      // Count event types
      const eventTypes = this.timeline.reduce((acc, event) => {
        acc[event.act] = (acc[event.act] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('[Player] Event types:', eventTypes);

      // Convert all events to actions
      this.convertEventsToActions();

      this.stateMachine.setState('ready');
    } catch (error) {
      console.error('[Player] Failed to load timeline:', error);
      this.stateMachine.setState('error');
      throw error;
    }
  }

  /**
   * Load a timeline from an array of events
   */
  async loadFromEvents(events: AnyActionPacket[]): Promise<void> {
    this.stateMachine.setState('loading');

    try {
      this.timeline = events;

      if (this.timeline.length === 0) {
        throw new Error('Timeline is empty');
      }

      // Set baseline time and duration
      const firstEvent = this.timeline[0];
      const lastEvent = this.timeline[this.timeline.length - 1];
      this.baselineTime = firstEvent?.t!;
      this.duration = lastEvent?.t! - firstEvent?.t!;

      console.log('[Player] Timeline loaded:', this.timeline.length, 'events');
      console.log('[Player] Duration:', this.duration / 1000, 'seconds');

      // Count event types
      const eventTypes = this.timeline.reduce((acc, event) => {
        acc[event.act] = (acc[event.act] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('[Player] Event types:', eventTypes);

      // Convert all events to actions
      this.convertEventsToActions();

      this.stateMachine.setState('ready');
    } catch (error) {
      console.error('[Player] Failed to load timeline:', error);
      this.stateMachine.setState('error');
      throw error;
    }
  }

  /**
   * Convert timeline events to scheduler actions
   * This is based on the old architecture where each event is converted up front
   *
   * @param fromTime - Only convert events from this absolute time onwards (optional)
   */
  private convertEventsToActions(fromTime?: number): void {
    const actions: ActionWithDelay[] = [];

    for (const event of this.timeline) {
      // Skip events before the start time (for seeking)
      if (fromTime !== undefined && event.t < fromTime) {
        continue;
      }

      // For full snapshots, apply tab state immediately
      if (isFullSnapshot(event)) {
        const snapshotPayload = event.p as SnapshotPayload;
        if (snapshotPayload.ui?.ide?.tabs?.editor) {
          const actionDelay = event.t - this.baselineTime;
          actions.push({
            delay: actionDelay,
            doAction: () => {
              this.ideTabPlayer.applyTabSnapshot(
                snapshotPayload.ui.ide.tabs.editor,
                (snapshotPayload.workspace?.files as Record<string, string>) || {}
              );
            },
          });
          console.log(`[Player] Converted FULL_SNAPSHOT tabs state at ${actionDelay}ms`);
        }
        continue;
      }

      switch (event.act) {
        case EventTypes.MOUSE_PATH:
          // Schedule each position at its exact recorded time (no interpolation)
          const payload = event.p as MousePathPayload;
          if (payload && payload.positions) {
            const positions = payload.positions;
            if (positions.length === 0) break;

            // Schedule each position at: event.t + position.timeOffset
            positions.forEach((pos) => {
              const actionDelay = (event.t - this.baselineTime) + pos.timeOffset;

              actions.push({
                delay: actionDelay,
                doAction: () => {
                  this.cursorPlayer.setPosition(pos.x, pos.y);
                  this.cursorPlayer.show();
                },
              });
            });

            // Add a dummy action to keep timer alive (like old architecture)
            const lastPosition = positions[positions.length - 1];
            if (lastPosition) {
              actions.push({
                delay: (event.t - this.baselineTime) - (lastPosition.timeOffset || 0),
                doAction: () => {
                  // Empty action to keep scheduler running
                },
              });
            }

            console.log(`[Player] Converted MOUSE_PATH with ${positions.length} positions using exact timeOffsets`);
          }
          break;

        case EventTypes.MOUSE_CLICK:
          // Schedule click animation
          const clickPayload = event.p as MouseClickPayload;
          if (clickPayload) {
            const actionDelay = event.t - this.baselineTime;
            actions.push({
              delay: actionDelay,
              doAction: () => {
                this.clickPlayer.showClick(clickPayload.x, clickPayload.y, clickPayload.btn);
              },
            });
            console.log(`[Player] Converted MOUSE_CLICK at (${clickPayload.x}, ${clickPayload.y}), button=${clickPayload.btn}`);
          }
          break;

        case EventTypes.MOUSE_STYLE:
          // Schedule cursor style change
          const stylePayload = event.p as MouseStylePayload;
          if (stylePayload) {
            const actionDelay = event.t - this.baselineTime;
            actions.push({
              delay: actionDelay,
              doAction: () => {
                this.stylePlayer.setCursorStyle(stylePayload.s);
              },
            });
            console.log(`[Player] Converted MOUSE_STYLE: ${stylePayload.s}`);
          }
          break;

        case EventTypes.IDE_TABS_OPEN:
          // Schedule tab open action
          const tabOpenPayload = event.p as IDETabsOpenPayload;
          if (tabOpenPayload && tabOpenPayload.path) {
            const actionDelay = event.t - this.baselineTime;
            actions.push({
              delay: actionDelay,
              doAction: () => {
                this.ideTabPlayer.playTabOpen(tabOpenPayload.path!, tabOpenPayload.content!);
              },
            });
            console.log(`[Player] Converted IDE_TABS_OPEN: ${tabOpenPayload.path}`);
          }
          break;

        case EventTypes.IDE_TABS_CLOSE:
          // Schedule tab close action
          const tabClosePayload = event.p as IDETabsClosePayload;
          if (tabClosePayload && tabClosePayload.path) {
            const actionDelay = event.t - this.baselineTime;
            actions.push({
              delay: actionDelay,
              doAction: () => {
                this.ideTabPlayer.playTabClose(tabClosePayload.path!);
              },
            });
            console.log(`[Player] Converted IDE_TABS_CLOSE: ${tabClosePayload.path}`);
          }
          break;

        case EventTypes.IDE_TABS_SWITCH:
          // Schedule tab switch action
          const tabSwitchPayload = event.p as IDETabsSwitchPayload;
          if (tabSwitchPayload && tabSwitchPayload.path) {
            const actionDelay = event.t - this.baselineTime;
            actions.push({
              delay: actionDelay,
              doAction: () => {
                this.ideTabPlayer.playTabSwitch(tabSwitchPayload.path!, tabSwitchPayload.content!);
              },
            });
            console.log(`[Player] Converted IDE_TABS_SWITCH: ${tabSwitchPayload.path}`);
          }
          break;

        // TODO: Handle other event types
        default:
          // For now, just log unhandled events
          const delay = event.t - this.baselineTime;
          actions.push({
            delay,
            doAction: () => {
              console.log('[Player] Unhandled event type:', event.act);
            },
          });
          break;
      }
    }

    const startLabel = fromTime !== undefined ? `from ${fromTime}ms` : 'all';
    console.log(`[Player] Converted ${startLabel}: ${this.timeline.length} events to ${actions.length} actions`);
    this.scheduler.addActions(actions);
  }

  /**
   * Start or resume playback
   */
  play(): void {
    if (!this.stateMachine.canPlay()) {
      console.warn('[Player] Cannot play in current state:', this.stateMachine.getState());
      return;
    }

    const previousState = this.stateMachine.getState();
    this.stateMachine.setState('playing');

    // Determine if we're starting fresh or resuming
    const isResumingFromPause = previousState === 'paused';

    if (isResumingFromPause) {
      // Resume from current timeOffset (don't reset to 0)
      this.scheduler.resume();
      console.log('[Player] Resuming playback from', this.scheduler.getCurrentTime() / 1000, 'seconds');
    } else {
      // First play - start from beginning
      this.scheduler.start();
      console.log('[Player] Starting playback from beginning');
    }

    // Sync audio if available
    if (this.audioElement) {
      this.audioElement.currentTime = this.scheduler.getCurrentTime() / 1000;
      this.audioElement.play();
    }

    // Show cursor for playback
    this.cursorPlayer.show();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.stateMachine.canPause()) {
      console.warn('[Player] Cannot pause in current state:', this.stateMachine.getState());
      return;
    }

    this.stateMachine.setState('paused');

    // Pause scheduler
    this.scheduler.pause();

    // Pause audio if available
    if (this.audioElement) {
      this.audioElement.pause();
    }

    // Hide cursor
    this.cursorPlayer.hide();

    console.log('[Player] Playback paused at', this.scheduler.getCurrentTime() / 1000, 'seconds');
  }

  /**
   * Seek to a specific time
   * @param time - Relative time from start (in ms)
   */
  async seek(time: number): Promise<void> {
    if (!this.stateMachine.canSeek()) {
      console.warn('[Player] Cannot seek in current state:', this.stateMachine.getState());
      return;
    }

    const wasPlaying = this.stateMachine.getState() === 'playing';

    // Pause if playing
    if (wasPlaying) {
      this.pause();
    }

    this.stateMachine.setState('seeking');

    console.log('[Player] Seeking to', time / 1000, 'seconds');

    try {
      const absoluteTime = this.baselineTime + time;

      // Reconstruct ground truth state at target time
      await this.stateReconstructor.reconstructStateAtTime(this.timeline, absoluteTime);

      // Clear and rebuild actions from seek point
      this.scheduler.clear();
      this.scheduler.setTimeOffset(time);

      // Re-convert only events from the seek point forward
      // This prevents actions before seek time from executing immediately
      this.convertEventsToActions(absoluteTime);

      // Seek audio if available
      if (this.audioElement) {
        this.audioElement.currentTime = time / 1000;
      }

      this.stateMachine.setState('paused');

      // Resume playback if it was playing before
      if (wasPlaying) {
        this.play();
      }

      console.log('[Player] Seek completed');
    } catch (error) {
      console.error('[Player] Seek failed:', error);
      this.stateMachine.setState('error');
      throw error;
    }
  }

  /**
   * Get the current playback time
   */
  getCurrentTime(): number {
    return this.scheduler.getCurrentTime();
  }

  /**
   * Get the total duration
   */
  getDuration(): number {
    return this.duration;
  }

  /**
   * Get the current state
   */
  getState(): PlayerState {
    return this.stateMachine.getState();
  }

  /**
   * Get the ground truth state (only valid after seek or pause)
   */
  getGroundTruthState(): { ui: UIState | null; workspace: WorkspaceState | null } {
    return this.stateReconstructor.getGroundTruthState();
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(state: PlayerState, callback: () => void): () => void {
    return this.stateMachine.onStateChange(state, callback);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop playback
    if (this.stateMachine.getState() === 'playing') {
      this.pause();
    }

    // Clear scheduler
    this.scheduler.clear();

    // Destroy cursor players
    this.cursorPlayer.destroy();
    this.clickPlayer.destroy();
    this.stylePlayer.destroy();

    // Destroy IDE tab player
    this.ideTabPlayer.destroy();

    console.log('[Player] Destroyed');
  }
}
