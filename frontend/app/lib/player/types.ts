/**
 * Player Type Definitions
 */

export type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'seeking' | 'error';

export interface PlayerConfig {
  /** Audio element for syncing playback */
  audioElement?: HTMLAudioElement;
}

export interface ScheduledEvent {
  event: any;
  scheduledTime: number;
  timeoutId: number;
}
