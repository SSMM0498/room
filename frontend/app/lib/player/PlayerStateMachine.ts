/**
 * Player State Machine
 *
 * Manages the state transitions for the player.
 */

import type { PlayerState } from './types';

export class PlayerStateMachine {
  private currentState: PlayerState = 'idle';
  private listeners: Map<PlayerState, Set<() => void>> = new Map();

  constructor() {
    // Initialize listener sets for all states
    const states: PlayerState[] = ['idle', 'loading', 'ready', 'playing', 'paused', 'seeking', 'error'];
    states.forEach(state => this.listeners.set(state, new Set()));
  }

  getState(): PlayerState {
    return this.currentState;
  }

  setState(newState: PlayerState): void {
    if (this.currentState === newState) return;

    const oldState = this.currentState;
    this.currentState = newState;

    console.trace(`[PlayerStateMachine] ${oldState} -> ${newState}`);

    // Notify listeners
    const stateListeners = this.listeners.get(newState);
    if (stateListeners) {
      stateListeners.forEach(listener => listener());
    }
  }

  onStateChange(state: PlayerState, callback: () => void): () => void {
    const stateListeners = this.listeners.get(state);
    if (stateListeners) {
      stateListeners.add(callback);
    }

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(state);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  canPlay(): boolean {
    return this.currentState === 'ready' || this.currentState === 'paused' || this.currentState === 'idle';
  }

  canPause(): boolean {
    return this.currentState === 'playing';
  }

  canSeek(): boolean {
    return this.currentState === 'ready' || this.currentState === 'paused' || this.currentState === 'playing';
  }
}
