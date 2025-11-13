import { ref, computed, onUnmounted, watch } from 'vue';
import { Player } from '~/lib/player';
import type { PlayerConfig, PlayerState } from '~/lib/player';
import type { AnyActionPacket, UIState, WorkspaceState } from '~/types/events';
import type { ActiveFile } from '../../types/file-tree';
import objectPath from 'object-path';
import { debug } from 'yaml/util';

export const usePlayer = () => {
  // Core Player instance
  const player = ref<Player | null>(null);
  const { openTabs, activeTab, setActiveTab, setTabContent, deleteTab, toggleOpenFolder, openFolders, directoryTree, setDirectoryTree, resourceCreation, renameContext, popoverState } = useIDE();
  const { socketClient } = useSocket();

  // Reactive state
  const currentTime = ref(0);
  const duration = ref(0);
  const playerState = ref<PlayerState>('idle');
  const audioElement = ref<HTMLAudioElement | null>(null);

  // Callback for file tree restoration from snapshots
  const onFileTreeRestore = (expandedPaths: string[], tree: any | null) => {
    console.log(`[Player] Restoring file tree from snapshot with ${expandedPaths.length} expanded paths`);

    // Restore directory tree if available
    if (tree) {
      // Deep clone the tree to avoid mutating the original
      const restoredTree = JSON.parse(JSON.stringify(tree));

      // Sync isOpen flags with expandedPaths
      const syncIsOpenFlags = (node: any, currentPath: string) => {
        if (!node || typeof node !== 'object') return;

        // Update isOpen flag based on expandedPaths
        if (node.type === 'directory') {
          node.isOpen = expandedPaths.includes(currentPath);
        }

        // Recursively sync children
        if (node.content && typeof node.content === 'object') {
          Object.values(node.content).forEach((child: any) => {
            if (child && child.path) {
              syncIsOpenFlags(child, child.path);
            }
          });
        }
      };

      // Start syncing from workspace root
      if (restoredTree.workspace) {
        syncIsOpenFlags(restoredTree.workspace, restoredTree.workspace.path);
      }

      setDirectoryTree(restoredTree);
      console.log(`[Player] Directory tree restored and synced with expanded paths`);
    }

    // Restore expanded folders AFTER setting the tree
    openFolders.value = [...expandedPaths];
  };

  // Watch player instance and set up tab callbacks
  watch(player, (newPlayer) => {
    if (newPlayer) {
      // Register tab switch callback
      newPlayer.getIdeTabPlayer().setOnTabSwitch((filePath: string, content: string) => {
        // Find or create tab with new content
        let tab = openTabs.tabs.find(t => t.filePath === filePath);
        if (!tab) {
          // If tab doesn't exist yet, create it
          tab = {
            filePath,
            fileContent: content
          };
          openTabs.tabs.push(tab);
        } else {
          // Update existing tab's content
          tab.fileContent = content;
        }
        setActiveTab(tab);
        setTabContent(tab);
        console.log(`[Player] Playing tab switch: ${filePath}`);
      });

      // Register tab open callback
      newPlayer.getIdeTabPlayer().setOnTabOpen((filePath: string, content: string) => {
        // Create and open new tab with content
        const newTab: ActiveFile = {
          filePath,
          fileContent: content
        };
        // Add to openTabs if not already there
        if (!openTabs.tabs.some(t => t.filePath === filePath)) {
          openTabs.tabs.push(newTab);
        }
        setActiveTab(newTab);
        setTabContent(newTab);
        console.log(`[Player] Playing tab open: ${filePath}`);
      });

      // Register tab close callback
      newPlayer.getIdeTabPlayer().setOnTabClose((filePath: string) => {
        // Find the tab to close
        const tabIndex = openTabs.tabs.findIndex(t => t.filePath === filePath);
        if (tabIndex !== -1) {
          // If this is the active tab, switch to another tab first
          if (activeTab && openTabs.tabs[tabIndex]!.filePath === activeTab.filePath) {
            const nextTab = openTabs.tabs[tabIndex + 1] || openTabs.tabs[tabIndex - 1];
            if (nextTab) {
              setActiveTab(nextTab);
            }
          }
          deleteTab(openTabs.tabs[tabIndex]!, tabIndex);
          console.log(`[Player] Playing tab close: ${filePath}`);
        } else {
          console.warn(`[Player] Cannot close tab ${filePath} - tab not found`);
        }
      });

      // Register folder expand/collapse callback
      newPlayer.getResourcePlayer().setOnFolderExpand((
        path: string,
        expanded: boolean,
        content?: Array<{ name: string; path: string; type: 'file' | 'directory' }>
      ) => {
        const isCurrentlyOpen = openFolders.value.includes(path);

        if (expanded) {
          // Add to openFolders if not already there
          if (!isCurrentlyOpen) {
            toggleOpenFolder(path);
          }

          // Always apply tree content if we have saved content from recording
          // This is important because snapshots may restore the expanded state
          // but not the folder contents
          if (content && content.length > 0) {
            const parentFoldersTillRoot = path
              .split("/")
              .splice(1)
              .join(".content.");

            const newDirectoryTree = JSON.parse(JSON.stringify(directoryTree));

            // Get the current directory object using objectPath
            const currentDir = objectPath.get(newDirectoryTree, parentFoldersTillRoot) as any;

            // Rebuild content from saved data
            if (currentDir && typeof currentDir === 'object') {
              currentDir.content = {};
              currentDir.isOpen = true;

              content.forEach((item) => {
                currentDir.content[item.name] = {
                  type: item.type,
                  isOpen: false,
                  path: item.path,
                  name: item.name,
                  content: {},
                };
              });

              objectPath.set(newDirectoryTree, parentFoldersTillRoot, currentDir);
              setDirectoryTree(newDirectoryTree);
              console.log(`[Player] Playing folder expand with saved content: ${path} (${content.length} items)`);
            }
          } else if (!isCurrentlyOpen) {
            // No saved content and folder wasn't already open, read from socket (fallback for old recordings)
            socketClient.readFolder({ targetPath: path });
            console.log(`[Player] Playing folder expand (reading from socket): ${path}`);
          }
        } else {
          // Collapse: remove from openFolders if currently open
          if (isCurrentlyOpen) {
            toggleOpenFolder(path);

            // Update tree structure to set isOpen to false
            const parentFoldersTillRoot = path
              .split("/")
              .splice(1)
              .join(".content.");

            const newDirectoryTree = JSON.parse(JSON.stringify(directoryTree));
            const currentDir = objectPath.get(newDirectoryTree, parentFoldersTillRoot) as any;

            if (currentDir && typeof currentDir === 'object') {
              currentDir.isOpen = false;
              objectPath.set(newDirectoryTree, parentFoldersTillRoot, currentDir);
              setDirectoryTree(newDirectoryTree);
            }

            socketClient.collapseFolder(path);
            console.log(`[Player] Playing folder collapse: ${path}`);
          }
        }
      });

      // Register file/folder creation callback
      newPlayer.getResourcePlayer().setOnCreate((path: string, type: 'f' | 'd') => {
        if (type === 'f') {
          socketClient.createFile({ targetPath: path });
          console.log(`[Player] Playing file create: ${path}`);
        } else {
          socketClient.createFolder({ targetPath: path });
          console.log(`[Player] Playing folder create: ${path}`);
        }
      });

      // Register file/folder deletion callback
      newPlayer.getResourcePlayer().setOnDelete((path: string) => {
        socketClient.deleteResource({ targetPath: path });
        console.log(`[Player] Playing resource delete: ${path}`);
      });

      // Register file/folder move callback
      newPlayer.getResourcePlayer().setOnMove((from: string, to: string) => {
        socketClient.moveResource({ targetPath: from, newPath: to });
        console.log(`[Player] Playing resource move: ${from} -> ${to}`);
      });

      // Register create input show callback
      newPlayer.getResourcePlayer().setOnCreateInputShow((type: 'file' | 'folder', parentPath: string) => {
        resourceCreation.isCreating = true;
        resourceCreation.type = type;
        resourceCreation.name = type === 'file' ? 'New file' : 'New folder';
        console.log(`[Player] Playing create input show: ${type} in ${parentPath}`);
      });

      // Register create input type callback
      newPlayer.getResourcePlayer().setOnCreateInputType((text: string) => {
        resourceCreation.name = text;
        console.log(`[Player] Playing create input type: "${text}"`);
      });

      // Register create input hide callback
      newPlayer.getResourcePlayer().setOnCreateInputHide((cancelled: boolean) => {
        resourceCreation.isCreating = false;
        console.log(`[Player] Playing create input hide: ${cancelled ? 'cancelled' : 'submitted'}`);
      });

      // Register rename input show callback
      newPlayer.getResourcePlayer().setOnRenameInputShow((path: string, currentName: string) => {
        renameContext.isRenaming = true;
        renameContext.path = path;
        renameContext.currentName = currentName;
        renameContext.newName = currentName;
        console.log(`[Player] Playing rename input show: ${path} (${currentName})`);
      });

      // Register rename input type callback
      newPlayer.getResourcePlayer().setOnRenameInputType((text: string) => {
        renameContext.newName = text;
        console.log(`[Player] Playing rename input type: "${text}"`);
      });

      // Register rename input hide callback
      newPlayer.getResourcePlayer().setOnRenameInputHide((cancelled: boolean) => {
        renameContext.isRenaming = false;
        renameContext.path = '';
        renameContext.currentName = '';
        renameContext.newName = '';
        console.log(`[Player] Playing rename input hide: ${cancelled ? 'cancelled' : 'submitted'}`);
      });

      // Register popover show callback
      newPlayer.getResourcePlayer().setOnPopoverShow((path: string) => {
        popoverState.isOpen = true;
        popoverState.path = path;
        console.log(`[Player] Playing popover show: ${path}`);
      });

      // Register popover hide callback
      newPlayer.getResourcePlayer().setOnPopoverHide((path: string) => {
        popoverState.isOpen = false;
        popoverState.path = '';
        console.log(`[Player] Playing popover hide: ${path}`);
      });

      // Register file tree restoration callback
      newPlayer.setOnFileTreeRestore(onFileTreeRestore);

      console.log('[Player] Tab and resource callbacks registered');
    }
  }, { immediate: true });

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

    console.log(' Player initialized');
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
   * Volume control (0-1)
   */
  const volume = ref(1);
  const isMuted = ref(false);
  const previousVolume = ref(1);

  const setVolume = (value: number) => {
    if (!audioElement.value) return;
    volume.value = Math.max(0, Math.min(1, value));
    audioElement.value.volume = volume.value;
    if (volume.value > 0) {
      isMuted.value = false;
    }
  };

  const toggleMute = () => {
    if (!audioElement.value) return;
    if (isMuted.value) {
      isMuted.value = false;
      setVolume(previousVolume.value);
    } else {
      previousVolume.value = volume.value;
      isMuted.value = true;
      setVolume(0);
    }
  };

  /**
   * Computed formatted times
   */
  const formattedCurrentTime = computed(() => formatTime(currentTime.value));
  const formattedDuration = computed(() => formatTime(duration.value));

  // requestAnimationFrame timer for updating current time
  let animationFrameId: number | null = null;

  const loopTimer = () => {
    stopTimer();

    const update = () => {
      if (player.value) {
        currentTime.value = player.value.getCurrentTime();

        if (currentTime.value < duration.value) {
          animationFrameId = requestAnimationFrame(update);
        }
      }
    };

    animationFrameId = requestAnimationFrame(update);
  };

  const stopTimer = () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  // Watch for state changes to start/stop update timer
  const watchStateChanges = () => {
    if (!player.value) return;

    player.value.onStateChange('playing', () => {
      loopTimer();
    });

    player.value.onStateChange('paused', () => {
      stopTimer();
    });

    player.value.onStateChange('seeking', () => {
      stopTimer();
    });
  };

  // Cleanup on unmount
  onUnmounted(() => {
    stopTimer();
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

    // Volume
    volume,
    isMuted,
    setVolume,
    toggleMute,

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
  };
};
