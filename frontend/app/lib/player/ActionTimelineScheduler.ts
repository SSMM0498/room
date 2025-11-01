/**
 * Action Timeline Scheduler
 *
 * Schedules and executes events at precise times during playback.
 */

import type { AnyActionPacket } from '~/types/events';
import type { ScheduledEvent } from './types';

export class ActionTimelineScheduler {
  private scheduledEvents: ScheduledEvent[] = [];
  private startTime: number = 0;
  private currentPlaybackTime: number = 0;
  private isPaused: boolean = true;

  constructor(private onEventExecute: (event: AnyActionPacket) => void) {}

  /**
   * Start scheduling events from a given time
   */
  start(fromTime: number = 0): void {
    this.startTime = Date.now() - fromTime;
    this.currentPlaybackTime = fromTime;
    this.isPaused = false;
  }

  /**
   * Pause the scheduler
   */
  pause(): void {
    this.isPaused = true;
    this.clearScheduledEvents();
  }

  /**
   * Resume the scheduler
   */
  resume(): void {
    this.isPaused = false;
    this.startTime = Date.now() - this.currentPlaybackTime;
  }

  /**
   * Schedule an event for execution
   */
  scheduleEvent(event: AnyActionPacket): void {
    if (this.isPaused) return;
    const currentTime = this.getCurrentTime();
    const delay = event.t - currentTime;

    if (delay <= 0) {
      // Execute immediately if the event is in the past or present
      this.onEventExecute(event);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      this.onEventExecute(event);
      this.removeScheduledEvent(timeoutId);
    }, delay);

    this.scheduledEvents.push({
      event,
      scheduledTime: Date.now() + delay,
      timeoutId,
    });
  }

  /**
   * Schedule multiple events
   */
  scheduleEvents(events: AnyActionPacket[]): void {
    events.forEach(event => this.scheduleEvent(event));
  }

  /**
   * Update current playback time
   */
  updatePlaybackTime(time: number): void {
    this.currentPlaybackTime = time;
  }

  /**
   * Clear all scheduled events
   */
  clearScheduledEvents(): void {
    this.scheduledEvents.forEach(({ timeoutId }) => clearTimeout(timeoutId));
    this.scheduledEvents = [];
  }

  /**
   * Remove a scheduled event by timeout ID
   */
  private removeScheduledEvent(timeoutId: number): void {
    this.scheduledEvents = this.scheduledEvents.filter(
      event => event.timeoutId !== timeoutId
    );
  }

  /**
   * Get the current playback time
   */
  getCurrentTime(): number {
    if (this.isPaused) {
      return this.currentPlaybackTime;
    }
    return Date.now() - this.startTime;
  }
}
