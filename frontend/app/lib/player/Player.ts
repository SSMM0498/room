/**
 * Core Player Class
 *
 * Reads the Action Log and audio file to replay a recorded session.
 * Manages playback state and provides seeking functionality.
 */

import type { AnyActionPacket, UIState, WorkspaceState } from '~/types/events';
import { PlayerStateMachine } from './PlayerStateMachine';
import { ActionTimelineScheduler } from './ActionTimelineScheduler';
import { StateReconstructor } from './StateReconstructor';
import type { PlayerConfig, PlayerState } from './types';

export class Player {
  private stateMachine: PlayerStateMachine;
  private scheduler: ActionTimelineScheduler;
  private stateReconstructor: StateReconstructor;
  private timeline: AnyActionPacket[] = [];
  private currentTime: number = 0;
  private duration: number = 0;

  // Audio element reference
  private audioElement: HTMLAudioElement | null = null;

  // Animation frame ID for playback loop
  private playbackLoopId: number | null = null;

  constructor(config: PlayerConfig = {}) {
    this.stateMachine = new PlayerStateMachine();
    this.scheduler = new ActionTimelineScheduler(this.executeEvent.bind(this));
    this.stateReconstructor = new StateReconstructor();
    this.audioElement = config.audioElement ?? null;
  }

  /**
   * Set or update the audio element for synchronized playback
   */
  setAudioElement(element: HTMLAudioElement): void {
    this.audioElement = element;
    console.log('[Player] Audio element set/updated');
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

      // Calculate duration
      const firstEvent = this.timeline[0];
      const lastEvent = this.timeline[this.timeline.length - 1];
      this.duration = lastEvent?.t! - firstEvent?.t!;

      console.log('[Player] Timeline loaded:', this.timeline.length, 'events');
      console.log('[Player] Duration:', this.duration / 1000, 'seconds');

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

      // Calculate duration
      const firstEvent = this.timeline[0];
      const lastEvent = this.timeline[this.timeline.length - 1];
      this.duration = lastEvent?.t! - firstEvent?.t!;

      console.log('[Player] Timeline loaded:', this.timeline.length, 'events');
      console.log('[Player] Duration:', this.duration / 1000, 'seconds');

      this.stateMachine.setState('ready');
    } catch (error) {
      console.error('[Player] Failed to load timeline:', error);
      this.stateMachine.setState('error');
      throw error;
    }
  }

  /**
   * Start or resume playback
   */
  play(): void {
    if (!this.stateMachine.canPlay()) {
      console.warn('[Player] Cannot play in current state:', this.stateMachine.getState());
      return;
    }
    this.stateMachine.setState('playing');
    if (this.stateMachine.getState() === 'idle') {
      // Resume scheduler
      this.scheduler.start();
    } else {
      // Resume scheduler
      this.scheduler.resume();
    }


    // Schedule upcoming events
    this.scheduleUpcomingEvents();

    // Sync audio if available
    if (this.audioElement) {
      this.audioElement.currentTime = this.currentTime / 1000;
      this.audioElement.play();
    }

    // Start playback loop
    this.startPlaybackLoop();

    console.log('[Player] Playback started from', this.currentTime / 1000, 'seconds');
  }

  /**
   * Pause playback
   */
  pause(): void {
    debugger
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

    // Stop playback loop
    this.stopPlaybackLoop();

    console.log('[Player] Playback paused at', this.currentTime / 1000, 'seconds');
  }

  /**
   * Seek to a specific time
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
      // Reconstruct ground truth state at target time
      await this.stateReconstructor.reconstructStateAtTime(this.timeline, time);

      // Update current time
      this.currentTime = time;
      this.scheduler.updatePlaybackTime(time);

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
   * Execute an event (called by scheduler)
   */
  private executeEvent(event: AnyActionPacket): void {
    console.log('[Player] Executing event:', event.src, event.act, 'at', event.t / 1000);

    // TODO: Implement event execution logic
    // This is where the player will update the UI, send commands, etc.
  }

  /**
   * Schedule upcoming events for playback
   */
  private scheduleUpcomingEvents(): void {
    const upcomingEvents = this.timeline.filter(
      event => event.t >= this.currentTime && event.t < this.currentTime + 5000
    );

    this.scheduler.scheduleEvents(upcomingEvents);
  }

  /**
   * Start the playback loop
   */
  private startPlaybackLoop(): void {
    const loop = () => {
      this.currentTime = this.scheduler.getCurrentTime();

      // Check if playback has ended
      if (this.currentTime >= this.duration) {
        console.log(">>> timing", this.currentTime, this.duration)
        this.pause();
        return;
      }

      // Schedule more events as we progress
      this.scheduleUpcomingEvents();

      this.playbackLoopId = requestAnimationFrame(loop);
    };

    this.playbackLoopId = requestAnimationFrame(loop);
  }

  /**
   * Stop the playback loop
   */
  private stopPlaybackLoop(): void {
    if (this.playbackLoopId !== null) {
      cancelAnimationFrame(this.playbackLoopId);
      this.playbackLoopId = null;
    }
  }

  /**
   * Get the current playback time
   */
  getCurrentTime(): number {
    return this.currentTime;
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
}
