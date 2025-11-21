import { ref, computed, onUnmounted, watch } from 'vue';
import { Player } from '~/lib/player';
import type { PlayerConfig, PlayerState } from '~/lib/player';
import type { AnyActionPacket, UIState } from '~/types/events';
import type { ActiveFile } from '~~/types/file-tree';
import type { PlayerNote } from '~/types/events.ts';
import objectPath from 'object-path';

// Global player instance and state (shared across all components)
const player = ref<Player | null>(null);
const currentTime = ref(0);
const duration = ref(0);
const playerState = ref<PlayerState>('idle');
const audioElement = ref<HTMLAudioElement | null>(null);
const notes = ref<PlayerNote[]>([]);

export const usePlayer = () => {
  const { openTabs, activeTab, setActiveTab, deleteTab, toggleOpenFolder, openFolders, directoryTree, setDirectoryTree, resourceCreation, renameContext, popoverState } = useIDE();

  // Helper functions for tree manipulation
  const pathToObjectPath = (path: string): string => {
    return path.split("/").splice(1).join(".content.");
  };

  const cloneTree = () => {
    return JSON.parse(JSON.stringify(directoryTree));
  };

  const getDirectoryAtPath = (tree: any, path: string): any => {
    const objectPathStr = pathToObjectPath(path);
    return objectPath.get(tree, objectPathStr);
  };

  const updateTreeAtPath = (tree: any, path: string, directory: any) => {
    const objectPathStr = pathToObjectPath(path);
    objectPath.set(tree, objectPathStr, directory);
    setDirectoryTree(tree);
  };

  const parseResourcePath = (path: string): { parentPath: string; resourceName: string } => {
    const lastSlashIndex = path.lastIndexOf('/');
    return {
      parentPath: path.substring(0, lastSlashIndex),
      resourceName: path.substring(lastSlashIndex + 1)
    };
  };

  // Sort directory contents: folders first (alphabetically), then files (alphabetically)
  const sortDirectoryContents = (directory: any) => {
    if (!directory || !directory.content) return;

    const entries = Object.entries(directory.content);
    const sorted = entries.sort(([, a]: [string, any], [, b]: [string, any]) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });

    // Rebuild content object in sorted order
    directory.content = {};
    sorted.forEach(([key, value]) => {
      directory.content[key] = value;
    });
  };

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
      newPlayer.geEditorTabPlayer().setOnTabSwitch((filePath: string) => {
        // Find or create tab (content will be built by typing events)
        let tab = openTabs.tabs.find(t => t.filePath === filePath);
        if (!tab) {
          // If tab doesn't exist yet, create it with empty content
          tab = {
            filePath,
            fileContent: '' // Empty - content built by typing events
          };
          openTabs.tabs.push(tab);
        }
        // Don't update existing tab's content - preserve content built by typing events
        setActiveTab(tab);
        // Don't call setTabContent - only switch active tab, preserve editor content
        console.log(`[Player] Playing tab switch: ${filePath} (content from typing events)`);
      });

      // Register tab open callback
      newPlayer.geEditorTabPlayer().setOnTabOpen((filePath: string) => {
        // Create and open new tab (content will be built by typing events)
        const newTab: ActiveFile = {
          filePath,
          fileContent: '' // Empty - content built by typing events
        };
        // Add to openTabs if not already there
        if (!openTabs.tabs.some(t => t.filePath === filePath)) {
          openTabs.tabs.push(newTab);
        }
        setActiveTab(newTab);
        // Don't call setTabContent - let typing events build the content
        console.log(`[Player] Playing tab open: ${filePath} (content from typing events)`);
      });

      // Register tab close callback
      newPlayer.geEditorTabPlayer().setOnTabClose((filePath: string) => {
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

      // Register callback for getting current open tabs (used for snapshot restoration)
      newPlayer.geEditorTabPlayer().setOnGetOpenTabs(() => {
        return openTabs.tabs.map(t => t.filePath);
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
            const newTree = cloneTree();
            const currentDir = getDirectoryAtPath(newTree, path);

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

              updateTreeAtPath(newTree, path, currentDir);
              console.log(`[Player] Playing folder expand with saved content: ${path} (${content.length} items)`);
            }
          }
        } else {
          // Collapse: remove from openFolders if currently open
          if (isCurrentlyOpen) {
            toggleOpenFolder(path);

            // Update tree structure to set isOpen to false
            const newTree = cloneTree();
            const currentDir = getDirectoryAtPath(newTree, path);

            if (currentDir && typeof currentDir === 'object') {
              currentDir.isOpen = false;
              updateTreeAtPath(newTree, path, currentDir);
            }

            console.log(`[Player] Playing folder collapse: ${path}`);
          }
        }
      });

      // Register file/folder creation callback
      newPlayer.getResourcePlayer().setOnCreate((path: string, type: 'f' | 'd') => {
        const { parentPath, resourceName } = parseResourcePath(path);
        const newTree = cloneTree();
        const parentDir = getDirectoryAtPath(newTree, parentPath);

        if (parentDir && typeof parentDir === 'object') {
          // Initialize content object if it doesn't exist
          if (!parentDir.content) {
            parentDir.content = {};
          }

          // Add new resource to parent's content
          parentDir.content[resourceName] = {
            type: type === 'f' ? 'file' : 'directory',
            isOpen: false,
            path: path,
            name: resourceName,
            content: {},
          };

          // Sort directory contents (folders first, then alphabetically)
          sortDirectoryContents(parentDir);

          updateTreeAtPath(newTree, parentPath, parentDir);
          console.log(`[Player] Playing ${type === 'f' ? 'file' : 'folder'} create: ${path}`);
        }
      });

      // Register file/folder deletion callback
      newPlayer.getResourcePlayer().setOnDelete((path: string) => {
        const { parentPath, resourceName } = parseResourcePath(path);
        const newTree = cloneTree();
        const parentDir = getDirectoryAtPath(newTree, parentPath);

        if (parentDir && typeof parentDir === 'object' && parentDir.content) {
          // Remove the resource from parent's content
          delete parentDir.content[resourceName];

          updateTreeAtPath(newTree, parentPath, parentDir);
          console.log(`[Player] Playing resource delete: ${path}`);
        }
      });

      // Register file/folder move callback
      newPlayer.getResourcePlayer().setOnMove((from: string, to: string) => {
        const { parentPath: oldParentPath, resourceName: oldResourceName } = parseResourcePath(from);
        const { parentPath: newParentPath, resourceName: newResourceName } = parseResourcePath(to);

        const newTree = cloneTree();
        const oldParentDir = getDirectoryAtPath(newTree, oldParentPath);

        if (oldParentDir && typeof oldParentDir === 'object' && oldParentDir.content) {
          // Get the resource object before removing it
          const resourceObj = oldParentDir.content[oldResourceName];

          if (resourceObj) {
            // Remove from old location
            delete oldParentDir.content[oldResourceName];

            // Get the new parent directory (using the already updated tree)
            const newParentDir = getDirectoryAtPath(newTree, newParentPath);

            if (newParentDir && typeof newParentDir === 'object') {
              // Initialize content object if it doesn't exist
              if (!newParentDir.content) {
                newParentDir.content = {};
              }

              // Update resource object with new path and name
              resourceObj.path = to;
              resourceObj.name = newResourceName;

              // Add to new location
              newParentDir.content[newResourceName] = resourceObj;

              // Sort both old and new parent directories
              sortDirectoryContents(oldParentDir);
              sortDirectoryContents(newParentDir);

              // Update both parent directories in the tree
              updateTreeAtPath(newTree, oldParentPath, oldParentDir);
              if (oldParentPath !== newParentPath) {
                // Need to get the updated tree and set the new parent
                const updatedNewParentDir = getDirectoryAtPath(newTree, newParentPath);
                updateTreeAtPath(newTree, newParentPath, updatedNewParentDir);
              }

              // Update open tabs if a file or files within a directory were renamed/moved
              const tabsToUpdate = openTabs.tabs.filter(tab =>
                tab.filePath === from || tab.filePath.startsWith(from + '/')
              );

              tabsToUpdate.forEach((tab) => {
                const tabIndex = openTabs.tabs.findIndex(t => t.filePath === tab.filePath);
                if (tabIndex !== -1) {
                  const oldPath = tab.filePath;
                  const newPath = oldPath === from
                    ? to
                    : to + oldPath.slice(from.length);

                  openTabs.tabs[tabIndex]!.filePath = newPath;

                  // Update active tab if it's the one being renamed
                  if (activeTab && activeTab.filePath === oldPath) {
                    activeTab.filePath = newPath;
                  }
                }
              });

              console.log(`[Player] Playing resource move: ${from} -> ${to}`);
            }
          }
        }
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
  const initializePlayer = () => {
    player.value = new Player();

    player.value.loadPersistedNotes();
    notes.value = player.value.getNotes();

    const unsubscribers = [
      player.value.onStateChange('idle', () => { playerState.value = 'idle'; }),
      player.value.onStateChange('loading', () => { playerState.value = 'loading'; }),
      player.value.onStateChange('ready', () => { playerState.value = 'ready'; }),
      player.value.onStateChange('playing', () => {
        playerState.value = 'playing';
        notes.value = player.value?.getNotes() || [];
      }),
      player.value.onStateChange('paused', () => { playerState.value = 'paused'; }),
      player.value.onStateChange('seeking', () => { playerState.value = 'seeking'; }),
      player.value.onStateChange('error', () => { playerState.value = 'error'; }),
    ];

    // Store unsubscribers for cleanup
    onUnmounted(() => {
      unsubscribers.forEach(unsub => unsub());
    });

    console.log('[usePlayer] Player initialized');
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
      initializePlayer();
      player.value!.setAudioElement(element);
    }
  };

  /**
   * Load a timeline from an array of events
   */
  const loadTimelineFromEvents = async (events: AnyActionPacket[]): Promise<void> => {
    if (!player.value) {
      console.error('L Player not initialized. Call initializePlayer first.');
      return;
    }

    await player.value.loadTimelineFromEvents(events);
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
   * Load a saved note by ID
   * Checks out the note's branch and seeks to the timestamp
   */
  const loadNote = async (noteId: string) => {
    if (!player.value) {
      console.error('[usePlayer] Cannot load note: Player not initialized');
      return;
    }
    await player.value.loadNote(noteId);
  };

  /**
   * Set the socket client for Git operations during pause/note loading
   */
  const setSocketClient = (client: any) => {
    if (!player.value) {
      console.error('[usePlayer] Cannot set socket client: Player not initialized');
      return;
    }
    player.value.setSocketClient(client);
  };

  /**
   * Set callback to be called when save-branch completes
   */
  const setOnSaveBranchComplete = (callback: () => void) => {
    if (!player.value) {
      console.error('[usePlayer] Cannot set save-branch callback: Player not initialized');
      return;
    }
    player.value.setOnSaveBranchComplete(callback);
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

    // Notes
    notes,
    loadNote,

    // Methods
    initializePlayer,
    setAudioElement,
    setSocketClient,
    setOnSaveBranchComplete,
    loadTimelineFromEvents,
    play,
    pause,
    togglePlayPause,
    seek,
    seekToPercentage,
    skipForward,
    skipBackward,
    formatTime,
    watchStateChanges,
  };
};
