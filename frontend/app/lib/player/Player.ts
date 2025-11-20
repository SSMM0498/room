/**
 * Core Player Class
 *
 * Reads the events from NDJSON and audio file to replay a recorded session.
 * Manages playback state and provides seeking functionality.
 *
 * Based on the old proven architecture where:
 * - Events are converted to actions on load
 * - Scheduler has its own RAF loop
 * - Each mouse position is a separate action
 */

import { EventTypes, isDeltaSnapshot, type AnyActionPacket, type MousePathPayload, type MouseClickPayload, type MouseStylePayload, type EditorTabsOpenPayload, type EditorTabsClosePayload, type EditorTabsSwitchPayload, type SnapshotPayload, type FilesExpandPayload, type FilesCreatePayload, type FilesDeletePayload, type FilesMovePayload, type FilesCreateInputShowPayload, type FilesCreateInputTypePayload, type FilesCreateInputHidePayload, type FilesRenameInputShowPayload, type FilesRenameInputTypePayload, type FilesRenameInputHidePayload, type FilesPopoverShowPayload, type FilesPopoverHidePayload, type EditorScrollPathPayload, type EditorTypePayload, type EditorPastePayload, type EditorSelectPayload, isFullSnapshot, type PlayerNote, type MetaStartPayload, type ActionPacket } from "~/types/events.js";
import { PlayerStateMachine } from './PlayerStateMachine';
import { ActionTimelineScheduler, type ActionWithDelay } from './ActionTimelineScheduler';
import { StateReconstructor } from './StateReconstructor';
import { CursorMovementTrigger } from './CursorMovementTrigger';
import { CursorInteractionTrigger } from './CursorInteractionTrigger';
import { CursorStyleTrigger } from './CursorStyleTrigger';
import { EditorTabTrigger } from './EditorTabTrigger';
import { ResourceTrigger } from './ResourceTrigger';
import { EditorScrollTrigger } from './EditorScrollTrigger';
import { EditorInputTrigger } from './EditorInputTrigger';
import type { PlayerState } from './types';

export class Player {
  private timeline: AnyActionPacket[] = [];
  private duration: number = 0;
  private audioElement: HTMLAudioElement | null = null;
  private baselineTime: number = 0; // First event timestamp

  // Internal manager
  private playerStateMachine: PlayerStateMachine;
  private scheduler: ActionTimelineScheduler;
  private stateReconstructor: StateReconstructor;

  // Triggers
  private cursorMovementTrigger: CursorMovementTrigger;
  private cursorInteractionTrigger: CursorInteractionTrigger;
  private cursorStyleTrigger: CursorStyleTrigger;
  private editorTabTrigger: EditorTabTrigger;
  private editorScrollTrigger: EditorScrollTrigger;
  private editorInputTrigger: EditorInputTrigger;
  private resourceTrigger: ResourceTrigger;

  // Socket client for Git checkout commands
  private socketClient: any | null = null;

  // Interactive notes - saved pause points with user changes
  private notes: PlayerNote[] = [];
  private activePauseBranch: string | null = null;
  private activePauseCommitHash: string | null = null;

  // File tree restoration callback
  private onFileTreeRestoreCallback: ((expandedPaths: string[], tree: any | null) => void) | null = null;

  constructor() {
    this.playerStateMachine = new PlayerStateMachine();
    this.scheduler = new ActionTimelineScheduler();
    this.stateReconstructor = new StateReconstructor();

    this.cursorMovementTrigger = new CursorMovementTrigger();
    this.cursorInteractionTrigger = new CursorInteractionTrigger();
    this.cursorStyleTrigger = new CursorStyleTrigger();
    this.editorTabTrigger = new EditorTabTrigger();
    this.resourceTrigger = new ResourceTrigger();
    this.editorScrollTrigger = new EditorScrollTrigger();
    this.editorInputTrigger = new EditorInputTrigger();

    // Link the style player to the cursor element (after it's created)
    this.setupStylePlayer();
  }

  /**
   * Initialize the state reconstructor with UI player references
   * Called after file tree callback is set
   */
  private initializeStateReconstructor(): void {
    if (this.onFileTreeRestoreCallback) {
      this.stateReconstructor.setUIPlayers(
        this.cursorMovementTrigger,
        this.editorTabTrigger,
        this.onFileTreeRestoreCallback
      );
    }
  }

  /**
   * Create the fake cursor element
   */
  private createCursorElement(): HTMLElement {
    // Check if cursor already exists
    const el = document.querySelector('.player-mouse');
    if (el) {
      return el as HTMLElement;
    }

    // Create new cursor element
    const cursor = document.createElement('div');
    cursor.className = 'player-mouse';
    cursor.style.position = 'fixed';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '9999';
    cursor.style.display = 'none';

    // Add inner light element
    const light = document.createElement('div');
    light.className = 'player-mouse-light';
    cursor.appendChild(light);

    document.body.appendChild(cursor);
    return cursor as HTMLElement
  }


  /**
   * Setup the style player with cursor element reference
   */
  private setupStylePlayer(): void {
    const cursorElement = this.createCursorElement();
    this.cursorStyleTrigger.setCursorElement(cursorElement);
    this.cursorMovementTrigger.setCursorElement(cursorElement);
  }

  /**
   * Set or update the audio element for synchronized playback
   */
  setAudioElement(element: HTMLAudioElement): void {
    this.audioElement = element;
  }

  /**
   * Get the IDE tab player instance for components to register playback callbacks
   */
  geEditorTabPlayer(): EditorTabTrigger {
    return this.editorTabTrigger;
  }

  /**
   * Get the resource player instance for components to register playback callbacks
   */
  getResourcePlayer(): ResourceTrigger {
    return this.resourceTrigger;
  }

  /**
   * Get the editor scroll player instance for components to register scroll callbacks
   */
  getEditorScrollPlayer(): EditorScrollTrigger {
    return this.editorScrollTrigger;
  }

  /**
   * Get the editor input player instance for components to register input callbacks
   */
  getEditorInputPlayer(): EditorInputTrigger {
    return this.editorInputTrigger;
  }

  /**
   * Set callback for file tree restoration from snapshots
   */
  setOnFileTreeRestore(callback: (expandedPaths: string[], tree: any | null) => void): void {
    this.onFileTreeRestoreCallback = callback;
    // Initialize the state reconstructor with UI player references
    this.initializeStateReconstructor();
  }

  /**
   * Set socket client for Git checkout operations during playback
   */
  setSocketClient(client: any): void {
    this.socketClient = client;
    console.log('[Player] Socket client set for Git operations');
  }

  /**
   * Checkout workspace to match the recording state at current timestamp
   * Called from learn page after socket connects/reconnects
   */
  async checkoutWorkspaceAtCurrentTime(): Promise<void> {
    if (!this.socketClient || !this.socketClient.isConnected) {
      console.warn('[Player] Cannot checkout workspace: socket not connected');
      return;
    }

    // Setup interactive branch at current timestamp
    // This handles both checkout and branch creation
    await this.setupInteractiveBranchAtCurrentTime();
  }

  /**
   * Setup interactive workspace for pause interaction
   * Checks for existing notes at current timestamp (in seconds), or checks out snapshot commit
   */
  private async setupInteractiveBranchAtCurrentTime(): Promise<void> {
    const currentTime = this.scheduler.getCurrentTime();
    const currentTimeSeconds = Math.floor(currentTime / 1000);

    // Check if a note already exists at this timestamp (using seconds)
    const existingNote = this.notes.find(n => n.timestamp === currentTimeSeconds);

    if (existingNote) {
      // Load existing note's branch
      console.log('[Player] Found existing note at', currentTimeSeconds, 'seconds, loading branch:', existingNote.branchName);
      await this.performGitCheckout(existingNote.branchName);
      this.activePauseBranch = existingNote.branchName;
      this.activePauseCommitHash = existingNote.commitHash;
    } else {
      // Get commit hash from snapshot at pause point
      const absoluteTime = this.baselineTime + currentTime;

      // Reconstruct state to get the commit hash from snapshot
      await this.stateReconstructor.reconstructStateAtTime(this.timeline, absoluteTime);
      const commitHash = this.stateReconstructor.getCommitHash();

      if (commitHash && commitHash !== '') {
        // Checkout the commit from the recording at pause point
        await this.performGitCheckout(commitHash);
        console.log('[Player] Checked out commit from snapshot:', commitHash.substring(0, 8));

        // Note: Branch creation will happen on resume via system:save-branch
        // Store commit hash for later use
        this.activePauseCommitHash = commitHash;
        this.activePauseBranch = null; // No branch yet until resume
      } else {
        console.warn('[Player] No commit hash in snapshot at pause time', currentTimeSeconds, 'seconds - cannot checkout workspace');
      }
    }
  }


  /**
   * Perform Git checkout to restore workspace to a specific commit or branch
   * Called during pause/seek operations and note loading
   */
  private async performGitCheckout(target: string): Promise<void> {
    if (!this.socketClient) {
      console.warn('[Player] No socket client available for Git checkout');
      return;
    }

    if (!this.socketClient.isConnected) {
      console.warn('[Player] Socket not connected, cannot perform Git checkout');
      return;
    }

    return new Promise((resolve, reject) => {
      console.log(`[Player] Performing Git checkout to: ${target.substring(0, 8)}`);

      // Send system:checkout command to Worker
      this.socketClient.instance?.send(JSON.stringify({
        event: 'system:checkout',
        data: { hash: target }
      }));

      // For now, just resolve immediately
      // In a real implementation, you might want to wait for an acknowledgment
      resolve();
    });
  }

  /**
   * Save all changes to an interactive branch
   * Creates or updates a branch at the current timestamp (in seconds)
   * Called when user resumes playback after pausing
   */
  private async performSaveBranch(timestampSeconds: number): Promise<{branchName: string, commitHash: string} | null> {
    if (!this.socketClient) {
      console.warn('[Player] No socket client available for Git save branch');
      return null;
    }

    if (!this.socketClient.isConnected) {
      console.warn('[Player] Socket not connected, cannot save branch');
      return null;
    }

    return new Promise((resolve, reject) => {
      const ackID = `save-branch-${Date.now()}`;
      console.log(`[Player] Saving branch for timestamp: ${timestampSeconds}s`);

      // Set up listener for response
      const handleResponse = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          if (response.event === 'system:save-branch' && response.data?.ackID === ackID) {
            this.socketClient.instance?.removeEventListener('message', handleResponse);

            if (response.data.error) {
              console.error('[Player] Save branch failed:', response.data.error);
              resolve(null);
            } else {
              console.log('[Player] Branch saved:', response.data.branchName, response.data.commitHash?.substring(0, 8));
              resolve({
                branchName: response.data.branchName,
                commitHash: response.data.commitHash
              });
            }
          }
        } catch (error) {
          // Ignore parse errors
        }
      };

      this.socketClient.instance?.addEventListener('message', handleResponse);

      // Send system:save-branch command to Worker
      this.socketClient.instance?.send(JSON.stringify({
        event: 'system:save-branch',
        data: {
          timestamp: timestampSeconds,
          ackID: ackID
        }
      }));

      // Timeout after 5 seconds
      setTimeout(() => {
        this.socketClient.instance?.removeEventListener('message', handleResponse);
        console.warn('[Player] Save branch timeout');
        resolve(null);
      }, 5000);
    });
  }


  /**
   * Load a timeline from an array of events
   */
  async loadTimelineFromEvents(events: AnyActionPacket[]): Promise<void> {
    this.playerStateMachine.setState('loading');

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

      // Convert all events to actions
      this.convertEventsToActions();

      this.playerStateMachine.setState('ready');
      console.log('[Player] Timeline loaded:', this.timeline.length, 'events');
    } catch (error) {
      console.error('[Player] Failed to load timeline:', error);
      this.playerStateMachine.setState('error');
      throw error;
    }
  }

  /**
   * Convert events from the timeline into triggerable actions in the scheduler
   */
  private convertEventsToActions(fromTime?: number): void {
    const actions: ActionWithDelay[] = [];

    for (const event of this.timeline) {
      // Skip events before the start time (for seeking)
      if (fromTime !== undefined && event.t < fromTime) {
        continue;
      }

      if (isFullSnapshot(event)) {
        const snapshotPayload = event.p as SnapshotPayload;
        this.stateReconstructor.setFullSnapshot(snapshotPayload);
        continue; // Skip - snapshots are not converted to actions
      }

      if (isDeltaSnapshot(event)) {
        const snapshotPayload = event.p as SnapshotPayload;
        this.stateReconstructor.applyDelta(snapshotPayload);
        continue; // Skip - snapshots are not converted to actions
      }

      switch (event.act) {
        case EventTypes.MOUSE_PATH:
          const mousePathPayload = event.p as MousePathPayload;
          if (mousePathPayload && mousePathPayload.positions && mousePathPayload.positions.length !== 0) {
            const positions = mousePathPayload.positions;

            // Schedule each position at: event.t + position.timeOffset
            positions.forEach((pos) => {
              const actionDelay = (event.t - this.baselineTime) + pos.timeOffset;

              actions.push({
                delay: actionDelay,
                triggerAction: () => {
                  this.cursorMovementTrigger.setPosition(pos.x, pos.y);
                  this.cursorMovementTrigger.show();
                },
              });
            });

            // TODO: Find a way to keep timer alive other tan adding a dummy action
            // Add a dummy action to keep timer alive (like old architecture)
            // const lastPosition = positions[positions.length - 1];
            // if (lastPosition) {
            //   actions.push({
            //     delay: (event.t - this.baselineTime) - (lastPosition.timeOffset || 0),
            //     triggerAction: () => {
            //       // Empty action to keep scheduler running
            //     },
            //   });
            // }
          }
          break;

        case EventTypes.MOUSE_CLICK:
          const mouseClickPayload = event.p as MouseClickPayload;
          if (mouseClickPayload) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule click animation
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.cursorInteractionTrigger.showClick(mouseClickPayload.x, mouseClickPayload.y, mouseClickPayload.btn);
              },
            });
          }
          break;

        case EventTypes.MOUSE_STYLE:
          const mouseStylePayload = event.p as MouseStylePayload;
          if (mouseStylePayload) {
            // Schedule cursor style change
            const actionDelay = event.t - this.baselineTime;
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.cursorStyleTrigger.setCursorStyle(mouseStylePayload.s);
              },
            });
          }
          break;

        case EventTypes.FILES_EXPAND:
          const expandPayload = event.p as FilesExpandPayload;
          if (expandPayload && expandPayload.path !== undefined) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule folder expand/collapse action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playFolderExpand(expandPayload.path, expandPayload.expanded, expandPayload.content);
              },
            });
          }
          break;

        case EventTypes.FILES_CREATE:
          const createPayload = event.p as FilesCreatePayload;
          if (createPayload && createPayload.path) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule file/folder creation action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playCreate(createPayload.path, createPayload.type);
              },
            });
            if (createPayload.type === 'f') {
              actions.push({
                delay: actionDelay,
                triggerAction: () => {
                  this.editorTabTrigger.playTabOpen(createPayload.path!);
                },
              });
            }
          }
          break;

        case EventTypes.FILES_DELETE:
          const deletePayload = event.p as FilesDeletePayload;
          if (deletePayload && deletePayload.path) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule file/folder deletion action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playDelete(deletePayload.path);
              },
            });
          }
          break;

        case EventTypes.FILES_MOVE:
          const movePayload = event.p as FilesMovePayload;
          if (movePayload && movePayload.from && movePayload.to) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule file/folder move action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playMove(movePayload.from, movePayload.to);
              },
            });
          }
          break;

        case EventTypes.FILES_CREATE_INPUT_SHOW:
          const inputShowPayload = event.p as FilesCreateInputShowPayload;
          if (inputShowPayload) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule create input show action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playCreateInputShow(inputShowPayload.type, inputShowPayload.parentPath);
              },
            });
          }
          break;

        case EventTypes.FILES_CREATE_INPUT_TYPE:
          const inputTypePayload = event.p as FilesCreateInputTypePayload;
          if (inputTypePayload) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule create input type action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playCreateInputType(inputTypePayload.text);
              },
            });
          }
          break;

        case EventTypes.FILES_CREATE_INPUT_HIDE:
          const inputHidePayload = event.p as FilesCreateInputHidePayload;
          if (inputHidePayload !== undefined) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule create input hide action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playCreateInputHide(inputHidePayload.cancelled);
              },
            });
          }
          break;

        case EventTypes.FILES_RENAME_INPUT_SHOW:
          const renameShowPayload = event.p as FilesRenameInputShowPayload;
          if (renameShowPayload) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule rename input show action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playRenameInputShow(renameShowPayload.path, renameShowPayload.currentName);
              },
            });
          }
          break;

        case EventTypes.FILES_RENAME_INPUT_TYPE:
          const renameTypePayload = event.p as FilesRenameInputTypePayload;
          if (renameTypePayload) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule rename input type action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playRenameInputType(renameTypePayload.text);
              },
            });
          }
          break;

        case EventTypes.FILES_RENAME_INPUT_HIDE:
          const renameHidePayload = event.p as FilesRenameInputHidePayload;
          if (renameHidePayload !== undefined) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule rename input hide action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playRenameInputHide(renameHidePayload.cancelled);
              },
            });
          }
          break;

        case EventTypes.FILES_POPOVER_SHOW:
          const popoverShowPayload = event.p as FilesPopoverShowPayload;
          if (popoverShowPayload) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule popover show action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playPopoverShow(popoverShowPayload.path);
              },
            });
          }
          break;

        case EventTypes.FILES_POPOVER_HIDE:
          const popoverHidePayload = event.p as FilesPopoverHidePayload;
          if (popoverHidePayload) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule popover hide action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.resourceTrigger.playPopoverHide(popoverHidePayload.path);
              },
            });
          }
          break;

        case EventTypes.EDITOR_SCROLL:
          const scrollPathPayload = event.p as EditorScrollPathPayload;
          if (scrollPathPayload && scrollPathPayload.f && scrollPathPayload.positions && scrollPathPayload.positions.length !== 0) {
            const filePath = scrollPathPayload.f;
            const positions = scrollPathPayload.positions;

            // Schedule each position at: event.t + position.timeOffset
            positions.forEach((pos) => {
              const actionDelay = (event.t - this.baselineTime) + pos.timeOffset;

              actions.push({
                delay: actionDelay,
                triggerAction: () => {
                  this.editorScrollTrigger.playScroll(filePath, pos.top, pos.left);
                },
              });
            });
          }
          break;

        case EventTypes.EDITOR_TYPE:
          const editorTypePayload = event.p as EditorTypePayload;
          if (editorTypePayload && editorTypePayload.f) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule editor typing action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.editorInputTrigger.playType(editorTypePayload.f, editorTypePayload.c);
              },
            });
          }
          break;

        case EventTypes.EDITOR_PASTE:
          const editorPastePayload = event.p as EditorPastePayload;
          if (editorPastePayload && editorPastePayload.f) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule editor paste action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.editorInputTrigger.playPaste(editorPastePayload.f, editorPastePayload.c, editorPastePayload.pos);
              },
            });
          }
          break;

        case EventTypes.EDITOR_SELECT:
          const editorSelectPayload = event.p as EditorSelectPayload;
          if (editorSelectPayload && editorSelectPayload.f) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule editor selection action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.editorInputTrigger.playSelect(editorSelectPayload.f, editorSelectPayload.s, editorSelectPayload.e);
              },
            });
          }
          break;

        case EventTypes.EDITOR_TABS_OPEN:
          const tabOpenPayload = event.p as EditorTabsOpenPayload;
          if (tabOpenPayload && tabOpenPayload.path) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule tab open action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.editorTabTrigger.playTabOpen(tabOpenPayload.path!);
              },
            });
          }
          break;

        case EventTypes.EDITOR_TABS_CLOSE:
          const tabClosePayload = event.p as EditorTabsClosePayload;
          if (tabClosePayload && tabClosePayload.path) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule tab close action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.editorTabTrigger.playTabClose(tabClosePayload.path!);
              },
            });
          }
          break;

        case EventTypes.EDITOR_TABS_SWITCH:
          const tabSwitchPayload = event.p as EditorTabsSwitchPayload;
          if (tabSwitchPayload && tabSwitchPayload.path) {
            const actionDelay = event.t - this.baselineTime;
            // Schedule tab switch action
            actions.push({
              delay: actionDelay,
              triggerAction: () => {
                this.editorTabTrigger.playTabSwitch(tabSwitchPayload.path!);
              },
            });
          }
          break;

        // TODO: Handle other event types
        default:
          // For now, just log unhandled events
          const delay = event.t - this.baselineTime;
          actions.push({
            delay,
            triggerAction: () => {
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
  async play(): Promise<void> {
    if (!this.playerStateMachine.canPlay()) {
      console.warn('[Player] Cannot play in current state:', this.playerStateMachine.getState());
      return;
    }

    const previousState = this.playerStateMachine.getState();
    const isResumingFromPause = previousState === 'paused';

    if (isResumingFromPause) {
      // Save branch if socket is connected (BEFORE changing state to 'playing')
      if (this.socketClient && this.socketClient.isConnected) {
        const currentTime = this.scheduler.getCurrentTime();
        const currentTimeSeconds = Math.floor(currentTime / 1000);

        try {
          // Save branch with all changes from pause session
          const result = await this.performSaveBranch(currentTimeSeconds);

          if (result) {
            // Save as note with branch info
            const note: PlayerNote = {
              id: `note-${Date.now()}`,
              timestamp: currentTimeSeconds,
              branchName: result.branchName,
              commitHash: result.commitHash,
              createdAt: Date.now()
            };

            this.notes.push(note);
            this.persistNotes();
            console.log('[Player] Saved note:', note);
          }
        } catch (error) {
          console.error('[Player] Failed to save branch during resume:', error);
          // Continue with playback even if save fails
        }
      }

      // NOW set state to playing (after save-branch completes)
      // This triggers socket disconnection in learn page
      this.playerStateMachine.setState('playing');

      // Proceed with checkout and resume after save completes
      // Reconstruct state to get the commit hash from snapshot
      const currentTime = this.scheduler.getCurrentTime();
      const absoluteTime = this.baselineTime + currentTime;
      await this.stateReconstructor.reconstructStateAtTime(this.timeline, absoluteTime);

      // Checkout the commit from snapshot (restore main timeline)
      const timelineCommitHash = this.stateReconstructor.getCommitHash();
      if (timelineCommitHash) {
        await this.performGitCheckout(timelineCommitHash);
        console.log('[Player] Checked out timeline commit:', timelineCommitHash.substring(0, 8));
      }

      // Apply the reconstructed UI state
      this.stateReconstructor.applyReconstructedStateToUI();

      // Clear the active pause branch
      this.activePauseBranch = null;
      this.activePauseCommitHash = null;

      // Resume from current timeOffset (don't reset to 0)
      this.scheduler.resume();
      console.log('[Player] Resuming playback from', this.scheduler.getCurrentTime() / 1000, 'seconds');
    } else {
      // First play - set state immediately (no save-branch needed)
      this.playerStateMachine.setState('playing');

      // First play - start from beginning
      const metaStartEvent = this.timeline[0] as ActionPacket<MetaStartPayload>;
      const initialSnapshot = metaStartEvent.p.initialSnapshot;

      await this.stateReconstructor.setFullSnapshot(initialSnapshot);
      const initialCommitHash = this.stateReconstructor.getCommitHash();

      if (initialCommitHash) {
        await this.performGitCheckout(initialCommitHash);
        console.log('[Player] Checked out initial commit:', initialCommitHash.substring(0, 8));
      }

      this.stateReconstructor.applyReconstructedStateToUI();

      this.scheduler.start();
      console.log('[Player] Starting playback from beginning');
    }

    if (this.audioElement) {
      this.audioElement.currentTime = this.scheduler.getCurrentTime() / 1000;
      this.audioElement.play();
    }

    // Show cursor for playback
    this.cursorMovementTrigger.show();
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (!this.playerStateMachine.canPause()) {
      console.warn('[Player] Cannot pause in current state:', this.playerStateMachine.getState());
      return;
    }

    this.playerStateMachine.setState('paused');

    this.scheduler.pause();

    // Pause audio if available
    if (this.audioElement) {
      this.audioElement.pause();
    }

    // Hide cursor
    this.cursorMovementTrigger.hide();

    const currentTime = this.scheduler.getCurrentTime();
    console.log('[Player] Playback paused at', currentTime / 1000, 'seconds');

    // Setup interactive workspace for pause interaction (only if socket is connected)
    // If socket is not connected, this will be done when socket connects via checkoutWorkspaceAtCurrentTime()
    if (this.socketClient && this.socketClient.isConnected) {
      await this.setupInteractiveBranchAtCurrentTime();
    } else {
      console.log('[Player] Socket not connected during pause, Git operations will be performed when socket connects');
    }
  }

  /**
   * Seek to a specific time
   * @param time - Relative time from start (in ms)
   * @param options - Optional configuration for seek behavior
   *   - resumePlayback: Whether to resume playback after seeking if it was playing before (default: true)
   */
  async seek(time: number, options: { resumePlayback?: boolean } = {}): Promise<void> {
    if (!this.playerStateMachine.canSeek()) {
      console.warn('[Player] Cannot seek in current state:', this.playerStateMachine.getState());
      return;
    }

    const { resumePlayback = true } = options;
    const wasPlaying = this.playerStateMachine.getState() === 'playing';

    // Pause if playing
    if (wasPlaying) {
      this.pause();
    }

    this.playerStateMachine.setState('seeking');

    console.log('[Player] Seeking to', time / 1000, 'seconds');

    try {
      const absoluteTime = this.baselineTime + time;

      // Reconstruct ground truth state at target time
      // This loads the last full snapshot + all deltas before the target time
      await this.stateReconstructor.reconstructStateAtTime(this.timeline, absoluteTime);

      // Perform Git checkout to restore workspace state from snapshot's commit hash
      const commitHash = this.stateReconstructor.getCommitHash();
      if (commitHash && commitHash !== '') {
        await this.performGitCheckout(commitHash);
        console.log('[Player] Checked out commit from snapshot:', commitHash.substring(0, 8));
      } else {
        console.warn('[Player] No commit hash in snapshot at time', time / 1000, 'seconds - skipping checkout');
      }

      // Apply the reconstructed UI state
      this.stateReconstructor.applyReconstructedStateToUI();

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

      this.playerStateMachine.setState('paused');

      // Resume playback if it was playing before AND resumePlayback is true
      if (wasPlaying && resumePlayback) {
        this.play();
      }

      console.log('[Player] Seek completed', resumePlayback ? '(preserving playback state)' : '(staying paused)');
    } catch (error) {
      console.error('[Player] Seek failed:', error);
      this.playerStateMachine.setState('error');
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
    return this.playerStateMachine.getState();
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(state: PlayerState, callback: () => void): () => void {
    return this.playerStateMachine.onStateChange(state, callback);
  }

  /**
   * Get all saved notes
   */
  getNotes(): PlayerNote[] {
    return this.notes;
  }

  /**
   * Save the current pause branch as a note
   * Called when user resumes playback after pausing and making changes
   */
  saveCurrentBranchAsNote(description?: string): void {
    if (!this.activePauseBranch || !this.activePauseCommitHash) {
      console.warn('[Player] No active pause branch to save');
      return;
    }

    const note: PlayerNote = {
      id: `note-${Date.now()}`,
      timestamp: Math.floor(this.getCurrentTime() / 1000), // Use seconds
      branchName: this.activePauseBranch,
      commitHash: this.activePauseCommitHash,
      description,
      createdAt: Date.now()
    };

    this.notes.push(note);
    this.persistNotes();

    console.log('[Player] Saved note:', note);
  }

  /**
   * Load a saved note by checking out its branch and pausing at the timestamp
   * This allows the user to return to their saved interactive changes
   */
  async loadNote(noteId: string): Promise<void> {
    const note = this.notes.find(n => n.id === noteId);
    if (!note) {
      console.error('[Player] Note not found:', noteId);
      return;
    }

    console.log('[Player] Loading note:', note);

    // Pause playback if playing
    if (this.playerStateMachine.getState() === 'playing') {
      this.pause();
    }

    // Checkout the note's branch
    await this.performGitCheckout(note.branchName);

    // Seek to the note's timestamp and stay paused
    // (clicking on a note should always pause, not resume playback)
    await this.seek(note.timestamp, { resumePlayback: false });

    // Set the active pause branch so user can continue working
    this.activePauseBranch = note.branchName;
    this.activePauseCommitHash = note.commitHash;

    console.log('[Player] Note loaded successfully (player paused)');
  }

  /**
   * Persist notes to localStorage
   */
  private persistNotes(): void {
    try {
      localStorage.setItem('player-notes', JSON.stringify(this.notes));
    } catch (error) {
      console.error('[Player] Failed to persist notes:', error);
    }
  }

  /**
   * Load persisted notes from localStorage
   * Should be called during player initialization
   */
  loadPersistedNotes(): void {
    try {
      const stored = localStorage.getItem('player-notes');
      if (stored) {
        this.notes = JSON.parse(stored);
        console.log('[Player] Loaded', this.notes.length, 'persisted notes');
      }
    } catch (error) {
      console.error('[Player] Failed to load persisted notes:', error);
      this.notes = [];
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop playback
    if (this.playerStateMachine.getState() === 'playing') {
      this.pause();
    }

    // Clear scheduler
    this.scheduler.clear();

    // Destroy cursor players
    this.cursorMovementTrigger.destroy();
    this.cursorInteractionTrigger.destroy();
    this.cursorStyleTrigger.destroy();

    // Destroy IDE tab player
    this.editorTabTrigger.destroy();

    // Destroy resource player
    this.resourceTrigger.destroy();

    // Destroy editor players
    this.editorScrollTrigger.destroy();
    this.editorInputTrigger.destroy();

    console.log('[Player] Destroyed');
  }
}
