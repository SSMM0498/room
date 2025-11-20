/**
 * IdeTabWatcher - Records IDE tab operations (open/close/switch)
 *
 * Components register callbacks that trigger event recording when:
 * - File explorer opens a new tab
 * - Editor switches active tab
 * - Editor closes a tab
 */

import { EventTypes, type AddEventCallback } from '~/types/events';

export class EditorTabWatcher {
  private addEvent: AddEventCallback;

  constructor(addEvent: AddEventCallback) {
    this.addEvent = addEvent;
  }

  /**
   * Record a tab open event
   * Called by file-explorer when user opens a file
   * TODO: Call directly through the editor component because there are other ways to open a file than the file explorer
   */
  recordTabOpen(filePath: string): void {
    this.addEvent('ui', EventTypes.EDITOR_TABS_OPEN, {
      type: 'editor',
      path: filePath,
    });
    console.log(`[IdeTabWatcher] Tab opened: ${filePath}`);
  }

  /**
   * Record a tab close event
   * Called by editor when user closes a tab
   */
  recordTabClose(filePath: string): void {
    this.addEvent('ui', EventTypes.EDITOR_TABS_CLOSE, {
      type: 'editor',
      path: filePath,
    });
    console.log(`[IdeTabWatcher] Tab closed: ${filePath}`);
  }

  /**
   * Record a tab switch event
   * Called by editor when user switches to a different tab
   */
  recordTabSwitch(filePath: string): void {
    this.addEvent('ui', EventTypes.EDITOR_TABS_SWITCH, {
      type: 'editor',
      path: filePath,
    });
    console.log(`[IdeTabWatcher] Tab switched to: ${filePath}`);
  }
}
