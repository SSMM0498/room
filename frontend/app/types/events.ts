/**
 * Core Event System for Recorder/Player Architecture
 *
 * This file defines all event types used in the recording and playback system.
 * Events are categorized into: UI Effects, UI State, Commands, Ground Truth State, and Meta.
 */

// ============================================================================
// CORE STRUCTURES
// ============================================================================

/**
 * Base structure for all action packets in the system.
 * Every event follows this format.
 */
export interface ActionPacket<P = any> {
  /** Timestamp in milliseconds */
  t: number;
  /** Source component or system */
  src: string;
  /** Specific action that occurred */
  act: string;
  /** Data payload for the action */
  p: P;
}

// ============================================================================
// SNAPSHOT PAYLOADS (Ground Truth State)
// ============================================================================

/**
 * Mouse position state
 */
export interface MouseState {
  x: number;
  y: number;
}

/**
 * Scroll positions for all scrollable components
 */
export interface ScrollState {
  [componentId: string]: {
    top: number;
    left?: number;
  };
}

/**
 * IDE layout and tab state
 */
export interface IDEState {
  activePanel: 'editor' | 'terminal' | 'files' | 'browser';
  tabs: {
    editor: {
      openFiles: string[];
      activeFile: string | null;
    };
    terminal: {
      openTerminals: string[];
      activeTerminal: string | null;
    };
  };
}

/**
 * File tree expansion state
 */
export interface FileTreeState {
  expandedPaths: string[];
}

/**
 * Mini-browser state
 */
export interface BrowserState {
  url: string;
}

/**
 * Complete UI state for snapshots
 */
export interface UIState {
  mouse: MouseState;
  scrolls: ScrollState;
  ide: IDEState;
  fileTree: FileTreeState;
  browser: BrowserState;
}

/**
 * Full file state (all files with complete content)
 */
export interface FullFileState {
  [filePath: string]: string;
}

/**
 * Delta file state (only changes since last snapshot)
 */
export interface DeltaFileState {
  updated: { [filePath: string]: string };
  deleted: string[];
}

/**
 * Terminal instance state
 */
export interface TerminalState {
  id: string;
  title: string;
  buffer: string;
}

/**
 * Background process state
 */
export interface ProcessState {
  terminalId: string;
  command: string;
  startTime: number;
}

/**
 * Complete workspace state for snapshots
 */
export interface WorkspaceState {
  files: FullFileState | DeltaFileState;
  terminals: {
    [terminalId: string]: TerminalState;
  };
  processes: ProcessState[];
}

/**
 * Complete snapshot payload (both UI and workspace state)
 */
export interface SnapshotPayload {
  ui: UIState;
  workspace: WorkspaceState;
}

// ============================================================================
// CATEGORY 1: UI EFFECTS (Visual Playback Only)
// ============================================================================

/**
 * Single mouse position with timing information
 */
export interface MousePosition {
  x: number;
  y: number;
  /** Time offset in milliseconds from event timestamp */
  timeOffset: number;
}

export interface MousePathPayload {
  /** Array of mouse positions with timing information */
  positions: MousePosition[];
}

export interface MouseClickPayload {
  x: number;
  y: number;
  /** Button: 0=left, 1=middle, 2=right */
  btn: number;
}

export interface MouseStylePayload {
  /** Cursor style (e.g., 'pointer', 'text', 'grab') */
  s: string;
}

export interface EditorTypePayload {
  /** File path */
  f: string;
  /** Chunk of typed characters */
  c: string;
}

export interface EditorPastePayload {
  /** File path */
  f: string;
  /** Pasted content */
  c: string;
  /** Position where paste occurred [line, column] */
  pos?: [number, number];
}

// ============================================================================
// CATEGORY 2: UI STATE (Visual State of the IDE)
// ============================================================================

export interface EditorSelectPayload {
  /** File path */
  f: string;
  /** Selection start [line, column] */
  s: [number, number];
  /** Selection end [line, column] */
  e: [number, number];
}

export interface EditorScrollPayload {
  /** File path */
  f: string;
  top: number;
  left: number;
}

export interface TerminalScrollPayload {
  /** Terminal ID */
  id: string;
  top: number;
}

export interface BrowserScrollPayload {
  /** Browser instance ID (if multiple browsers supported) */
  id?: string;
  top: number;
  left: number;
}

export interface FileExplorerScrollPayload {
  /** File explorer instance ID (if multiple supported) */
  id?: string;
  top: number;
}

export interface IDEFocusPayload {
  target: 'editor' | 'terminal' | 'files' | 'browser';
  /** Optional ID for specific component instance */
  id?: string;
}

export interface IDETabsOpenPayload {
  type: 'editor' | 'terminal';
  /** File path for editor tabs */
  path?: string;
  /** Terminal ID for terminal tabs */
  id?: string;
}

export interface IDETabsClosePayload {
  type: 'editor' | 'terminal';
  path?: string;
  id?: string;
}

export interface IDETabsSwitchPayload {
  type: 'editor' | 'terminal';
  path?: string;
  id?: string;
}

export interface BrowserNavPayload {
  url: string;
}

// ============================================================================
// CATEGORY 3: COMMANDS (User Intent to Modify State)
// ============================================================================

export interface TerminalExecPayload {
  /** Terminal ID */
  id: string;
  /** Command string */
  cmd: string;
}

export interface FilesCreatePayload {
  path: string;
  /** Type: 'f' for file, 'd' for directory */
  type: 'f' | 'd';
}

export interface FilesDeletePayload {
  path: string;
}

export interface FilesMovePayload {
  from: string;
  to: string;
}

// ============================================================================
// CATEGORY 4: GROUND TRUTH STATE (Definitive State Changes)
// ============================================================================

export interface StateCommitPayload {
  /** File path */
  file: string;
  /** Full, confirmed content */
  content: string;
}

export interface TerminalOutPayload {
  /** Terminal ID */
  id: string;
  /** stdout/stderr data chunk */
  data: string;
}

export interface TerminalExitPayload {
  /** Terminal ID */
  id: string;
  /** Exit code */
  code: number;
}

// ============================================================================
// CATEGORY 5: META & INSTRUCTOR ACTIONS
// ============================================================================

export interface MetaStartPayload {
  version: number;
  timestamp: number;
}

export interface MetaEndPayload {
  timestamp: number;
}

export interface MetaChapterMarkPayload {
  title: string;
}

// ============================================================================
// TYPE-SAFE EVENT CREATORS
// ============================================================================

/**
 * Union type of all possible event packets for type safety
 */
export type AnyActionPacket =
  // UI Effects
  | ActionPacket<MousePathPayload>
  | ActionPacket<MouseClickPayload>
  | ActionPacket<MouseStylePayload>
  | ActionPacket<EditorTypePayload>
  | ActionPacket<EditorPastePayload>
  // UI State
  | ActionPacket<EditorSelectPayload>
  | ActionPacket<EditorScrollPayload>
  | ActionPacket<TerminalScrollPayload>
  | ActionPacket<BrowserScrollPayload>
  | ActionPacket<FileExplorerScrollPayload>
  | ActionPacket<IDEFocusPayload>
  | ActionPacket<IDETabsOpenPayload>
  | ActionPacket<IDETabsClosePayload>
  | ActionPacket<IDETabsSwitchPayload>
  | ActionPacket<BrowserNavPayload>
  // Commands
  | ActionPacket<TerminalExecPayload>
  | ActionPacket<FilesCreatePayload>
  | ActionPacket<FilesDeletePayload>
  | ActionPacket<FilesMovePayload>
  // Ground Truth State
  | ActionPacket<SnapshotPayload>
  | ActionPacket<StateCommitPayload>
  | ActionPacket<TerminalOutPayload>
  | ActionPacket<TerminalExitPayload>
  // Meta
  | ActionPacket<MetaStartPayload>
  | ActionPacket<MetaEndPayload>
  | ActionPacket<MetaChapterMarkPayload>;

// ============================================================================
// EVENT TYPE CONSTANTS
// ============================================================================

export const EventTypes = {
  // UI Effects
  MOUSE_PATH: 'mouse:path',
  MOUSE_CLICK: 'mouse:click',
  MOUSE_STYLE: 'mouse:style',
  EDITOR_TYPE: 'editor:type',
  EDITOR_PASTE: 'editor:paste',

  // UI State
  EDITOR_SELECT: 'editor:select',
  EDITOR_SCROLL: 'editor:scroll',
  TERMINAL_SCROLL: 'terminal:scroll',
  BROWSER_SCROLL: 'browser:scroll',
  FILE_EXPLORER_SCROLL: 'files:scroll',
  IDE_FOCUS: 'ide:focus',
  IDE_TABS_OPEN: 'ide:tabs:open',
  IDE_TABS_CLOSE: 'ide:tabs:close',
  IDE_TABS_SWITCH: 'ide:tabs:switch',
  BROWSER_NAV: 'browser:nav',

  // Commands
  TERMINAL_EXEC: 'terminal:exec',
  FILES_CREATE: 'files:create',
  FILES_DELETE: 'files:delete',
  FILES_MOVE: 'files:move',

  // Ground Truth State
  STATE_SNAPSHOT_FULL: 'state:snapshot:full',
  STATE_SNAPSHOT_DELTA: 'state:snapshot:delta',
  STATE_COMMIT: 'state:commit',
  TERMINAL_OUT: 'terminal:out',
  TERMINAL_EXIT: 'terminal:exit',

  // Meta
  META_START: 'meta:start',
  META_END: 'meta:end',
  META_CHAPTER_MARK: 'meta:chapter:mark',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Creates a new action packet with the current timestamp
 */
export function createActionPacket<P>(
  src: string,
  act: string,
  payload: P,
  timestamp?: number
): ActionPacket<P> {
  return {
    t: timestamp ?? Date.now(),
    src,
    act,
    p: payload,
  };
}

/**
 * Type guard to check if an event is a full snapshot
 */
export function isFullSnapshot(event: ActionPacket): event is ActionPacket<SnapshotPayload> {
  return event.src === 'state' && event.act === EventTypes.STATE_SNAPSHOT_FULL;
}

/**
 * Type guard to check if an event is a delta snapshot
 */
export function isDeltaSnapshot(event: ActionPacket): event is ActionPacket<SnapshotPayload> {
  return event.src === 'state' && event.act === EventTypes.STATE_SNAPSHOT_DELTA;
}

/**
 * Type guard to check if an event is any kind of snapshot
 */
export function isSnapshot(event: ActionPacket): event is ActionPacket<SnapshotPayload> {
  return isFullSnapshot(event) || isDeltaSnapshot(event);
}

/**
 * Type guard to check if an event is a state commit
 */
export function isStateCommit(event: ActionPacket): event is ActionPacket<StateCommitPayload> {
  return event.src === 'state' && event.act === EventTypes.STATE_COMMIT;
}
