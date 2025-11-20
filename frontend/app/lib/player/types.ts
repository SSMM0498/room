/**
 * Player Type Definitions
 */

// TODO: Add interacting state
export type PlayerState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'seeking' | 'error';

export interface ScheduledEvent {
  event: any;
  scheduledTime: number;
  timeoutId: number;
}
