/**
 * Scroll Player
 *
 * Handles playback of scroll events for editor and terminal components.
 * Maintains a registry of scrollable elements and their identifiers.
 */

import type { EditorScrollPayload, TerminalScrollPayload, BrowserScrollPayload, FileExplorerScrollPayload } from '~/types/events';

export class ScrollPlayer {
  private editorElements: Map<string, HTMLElement> = new Map(); // file path -> element
  private terminalElements: Map<string, HTMLElement> = new Map(); // terminal ID -> element
  private browserElements: Map<string, HTMLElement> = new Map(); // browser ID -> element
  private fileExplorerElements: Map<string, HTMLElement> = new Map(); // file explorer ID -> element

  /**
   * Register an editor element for scroll playback
   * @param filePath - The file path identifier
   * @param element - The scrollable DOM element (e.g., Monaco editor's scroll container)
   */
  registerEditor(filePath: string, element: HTMLElement): void {
    if (!element) {
      console.warn('[ScrollPlayer] Cannot register null editor element');
      return;
    }

    this.editorElements.set(filePath, element);
    console.log(`[ScrollPlayer] Registered editor: ${filePath}`);
  }

  /**
   * Unregister an editor element
   */
  unregisterEditor(filePath: string): void {
    if (this.editorElements.delete(filePath)) {
      console.log(`[ScrollPlayer] Unregistered editor: ${filePath}`);
    }
  }

  /**
   * Register a terminal element for scroll playback
   * @param terminalId - The terminal identifier
   * @param element - The scrollable DOM element (e.g., Xterm.js container)
   */
  registerTerminal(terminalId: string, element: HTMLElement): void {
    if (!element) {
      console.warn('[ScrollPlayer] Cannot register null terminal element');
      return;
    }

    this.terminalElements.set(terminalId, element);
    console.log(`[ScrollPlayer] Registered terminal: ${terminalId}`);
  }

  /**
   * Unregister a terminal element
   */
  unregisterTerminal(terminalId: string): void {
    if (this.terminalElements.delete(terminalId)) {
      console.log(`[ScrollPlayer] Unregistered terminal: ${terminalId}`);
    }
  }

  /**
   * Register a browser element for scroll playback
   * @param browserId - The browser identifier (optional, defaults to 'default')
   * @param element - The scrollable DOM element
   */
  registerBrowser(browserId: string = 'default', element: HTMLElement): void {
    if (!element) {
      console.warn('[ScrollPlayer] Cannot register null browser element');
      return;
    }

    this.browserElements.set(browserId, element);
    console.log(`[ScrollPlayer] Registered browser: ${browserId}`);
  }

  /**
   * Unregister a browser element
   */
  unregisterBrowser(browserId: string = 'default'): void {
    if (this.browserElements.delete(browserId)) {
      console.log(`[ScrollPlayer] Unregistered browser: ${browserId}`);
    }
  }

  /**
   * Register a file explorer element for scroll playback
   * @param explorerId - The file explorer identifier (optional, defaults to 'default')
   * @param element - The scrollable DOM element
   */
  registerFileExplorer(explorerId: string = 'default', element: HTMLElement): void {
    if (!element) {
      console.warn('[ScrollPlayer] Cannot register null file explorer element');
      return;
    }

    this.fileExplorerElements.set(explorerId, element);
    console.log(`[ScrollPlayer] Registered file explorer: ${explorerId}`);
  }

  /**
   * Unregister a file explorer element
   */
  unregisterFileExplorer(explorerId: string = 'default'): void {
    if (this.fileExplorerElements.delete(explorerId)) {
      console.log(`[ScrollPlayer] Unregistered file explorer: ${explorerId}`);
    }
  }

  /**
   * Apply an editor scroll event
   */
  scrollEditor(payload: EditorScrollPayload): void {
    const element = this.editorElements.get(payload.f);
    if (!element) {
      console.warn(`[ScrollPlayer] Editor element not found: ${payload.f}`);
      return;
    }

    // Direct scroll position setting (more reliable than smooth scrolling)
    element.scrollTop = payload.top;
    element.scrollLeft = payload.left;

    console.log(`[ScrollPlayer] Scrolled editor ${payload.f} to (${payload.top}, ${payload.left})`);
  }

  /**
   * Apply a terminal scroll event
   */
  scrollTerminal(payload: TerminalScrollPayload): void {
    const element = this.terminalElements.get(payload.id);
    if (!element) {
      console.warn(`[ScrollPlayer] Terminal element not found: ${payload.id}`);
      return;
    }

    // Direct scroll position setting
    element.scrollTop = payload.top;

    console.log(`[ScrollPlayer] Scrolled terminal ${payload.id} to ${payload.top}`);
  }

  /**
   * Apply a browser scroll event
   */
  scrollBrowser(payload: BrowserScrollPayload): void {
    const browserId = payload.id || 'default';
    const element = this.browserElements.get(browserId);
    if (!element) {
      console.warn(`[ScrollPlayer] Browser element not found: ${browserId}`);
      return;
    }

    // Direct scroll position setting
    element.scrollTop = payload.top;
    element.scrollLeft = payload.left;

    console.log(`[ScrollPlayer] Scrolled browser ${browserId} to (${payload.top}, ${payload.left})`);
  }

  /**
   * Apply a file explorer scroll event
   */
  scrollFileExplorer(payload: FileExplorerScrollPayload): void {
    const explorerId = payload.id || 'default';
    const element = this.fileExplorerElements.get(explorerId);
    if (!element) {
      console.warn(`[ScrollPlayer] File explorer element not found: ${explorerId}`);
      return;
    }

    // Direct scroll position setting
    element.scrollTop = payload.top;

    console.log(`[ScrollPlayer] Scrolled file explorer ${explorerId} to ${payload.top}`);
  }

  /**
   * Get all registered editor paths
   */
  getRegisteredEditors(): string[] {
    return Array.from(this.editorElements.keys());
  }

  /**
   * Get all registered terminal IDs
   */
  getRegisteredTerminals(): string[] {
    return Array.from(this.terminalElements.keys());
  }

  /**
   * Get all registered browser IDs
   */
  getRegisteredBrowsers(): string[] {
    return Array.from(this.browserElements.keys());
  }

  /**
   * Get all registered file explorer IDs
   */
  getRegisteredFileExplorers(): string[] {
    return Array.from(this.fileExplorerElements.keys());
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.editorElements.clear();
    this.terminalElements.clear();
    this.browserElements.clear();
    this.fileExplorerElements.clear();
    console.log('[ScrollPlayer] Cleared all scroll element registrations');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clear();
  }
}
