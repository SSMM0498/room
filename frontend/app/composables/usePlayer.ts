import { ref, computed, onUnmounted } from 'vue';
import { Player } from '~/lib/player';
import type { PlayerConfig, PlayerState } from '~/lib/player';
import type { AnyActionPacket, UIState, WorkspaceState } from '~/types/events';

export const usePlayer = () => {
  // Core Player instance
  const player = ref<Player | null>(null);

  // Reactive state
  const currentTime = ref(0);
  const duration = ref(0);
  const playerState = ref<PlayerState>('idle');
  const audioElement = ref<HTMLAudioElement | null>(null);

  // Computed properties
  const isPlaying = computed(() => playerState.value === 'playing');
  const isPaused = computed(() => playerState.value === 'paused');
  const isReady = computed(() => playerState.value === 'ready' || playerState.value === 'paused' || playerState.value === 'playing');
  const isLoading = computed(() => playerState.value === 'loading');
  const isSeeking = computed(() => playerState.value === 'seeking');
  const hasError = computed(() => playerState.value === 'error');

  // Progress as percentage
  const progress = computed(() => {
    if (duration.value === 0) return 0;
    return (currentTime.value / duration.value) * 100;
  });

  /**
   * Initialize the player with optional audio element
   */
  const initializePlayer = (config?: PlayerConfig) => {
    player.value = new Player(config);

    // Set up state change listeners
    const unsubscribers = [
      player.value.onStateChange('idle', () => { playerState.value = 'idle'; }),
      player.value.onStateChange('loading', () => { playerState.value = 'loading'; }),
      player.value.onStateChange('ready', () => { playerState.value = 'ready'; }),
      player.value.onStateChange('playing', () => { playerState.value = 'playing'; }),
      player.value.onStateChange('paused', () => { playerState.value = 'paused'; }),
      player.value.onStateChange('seeking', () => { playerState.value = 'seeking'; }),
      player.value.onStateChange('error', () => { playerState.value = 'error'; }),
    ];

    // Store unsubscribers for cleanup
    onUnmounted(() => {
      unsubscribers.forEach(unsub => unsub());
    });

    console.log(' Player initialized');
  };

  /**
   * Set the audio element for synced playback
   */
  const setAudioElement = (element: HTMLAudioElement) => {
    audioElement.value = element;
    if (player.value) {
      // Set audio element on existing player instance
      player.value.setAudioElement(element);
    } else {
      // If player doesn't exist yet, initialize with audio element
      const config: PlayerConfig = { audioElement: element };
      initializePlayer(config);
    }
  };

  /**
   * Load a timeline from NDJSON string
   */
  const loadFromNDJSON = async (ndjson: string): Promise<void> => {
    if (!player.value) {
      console.error('L Player not initialized. Call initializePlayer first.');
      return;
    }

    await player.value.loadFromNDJSON(ndjson);
    duration.value = player.value.getDuration();
    currentTime.value = 0;
  };

  /**
   * Load a timeline from an array of events
   */
  const loadFromEvents = async (events: AnyActionPacket[]): Promise<void> => {
    if (!player.value) {
      console.error('L Player not initialized. Call initializePlayer first.');
      return;
    }

    await player.value.loadFromEvents(events);
    duration.value = player.value.getDuration();
    currentTime.value = 0;
  };

  /**
   * Start playback
   */
  const play = () => {
    if (!player.value) {
      console.error('L Player not initialized.');
      return;
    }

    player.value.play();
  };

  /**
   * Pause playback
   */
  const pause = () => {
    if (!player.value) {
      console.error('L Player not initialized.');
      return;
    }

    player.value.pause();
  };

  /**
   * Toggle play/pause
   */
  const togglePlayPause = () => {
    if (isPlaying.value) {
      pause();
    } else if (isPaused.value || isReady.value) {
      play();
    }
  };

  /**
   * Seek to a specific time in milliseconds
   */
  const seek = async (time: number) => {
    if (!player.value) {
      console.error('L Player not initialized.');
      return;
    }

    await player.value.seek(time);
    currentTime.value = time;
  };

  /**
   * Seek to a specific percentage (0-100)
   */
  const seekToPercentage = async (percentage: number) => {
    const time = (percentage / 100) * duration.value;
    await seek(time);
  };

  /**
   * Skip forward by a given duration in milliseconds
   */
  const skipForward = async (ms: number = 10000) => {
    const newTime = Math.min(currentTime.value + ms, duration.value);
    await seek(newTime);
  };

  /**
   * Skip backward by a given duration in milliseconds
   */
  const skipBackward = async (ms: number = 10000) => {
    const newTime = Math.max(currentTime.value - ms, 0);
    await seek(newTime);
  };

  /**
   * Get the current ground truth state (UI + Workspace)
   */
  const getGroundTruthState = (): { ui: UIState | null; workspace: WorkspaceState | null } => {
    if (!player.value) {
      return { ui: null, workspace: null };
    }
    return player.value.getGroundTruthState();
  };

  /**
   * Format time in MM:SS format
   */
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Computed formatted times
   */
  const formattedCurrentTime = computed(() => formatTime(currentTime.value));
  const formattedDuration = computed(() => formatTime(duration.value));

  /**
   * Update current time (called from playback loop)
   */
  const updateCurrentTime = () => {
    if (player.value && isPlaying.value) {
      currentTime.value = player.value.getCurrentTime();
    }
  };

  // Start a timer to update current time during playback
  let updateTimer: number | null = null;
  const startUpdateTimer = () => {
    stopUpdateTimer();
    updateTimer = window.setInterval(() => {
      if (isPlaying.value) {
        updateCurrentTime();
      }
    }, 100); // Update every 100ms
  };

  const stopUpdateTimer = () => {
    if (updateTimer !== null) {
      clearInterval(updateTimer);
      updateTimer = null;
    }
  };

  // Watch for state changes to start/stop update timer
  const watchStateChanges = () => {
    if (!player.value) return;

    player.value.onStateChange('playing', () => {
      startUpdateTimer();
    });

    player.value.onStateChange('paused', () => {
      stopUpdateTimer();
      updateCurrentTime(); // Final update
    });

    player.value.onStateChange('seeking', () => {
      stopUpdateTimer();
    });
  };

  // Cleanup on unmount
  onUnmounted(() => {
    stopUpdateTimer();
    if (player.value) {
      if (player.value.getState() === 'playing') {
        player.value.pause();
      }
    }
  });

  return {
    // Core
    player,
    audioElement,

    // State
    playerState,
    isPlaying,
    isPaused,
    isReady,
    isLoading,
    isSeeking,
    hasError,

    // Time
    currentTime,
    duration,
    progress,
    formattedCurrentTime,
    formattedDuration,

    // Methods
    initializePlayer,
    setAudioElement,
    loadFromNDJSON,
    loadFromEvents,
    play,
    pause,
    togglePlayPause,
    seek,
    seekToPercentage,
    skipForward,
    skipBackward,
    getGroundTruthState,
    formatTime,
    watchStateChanges,
    updateCurrentTime,
  };
};
