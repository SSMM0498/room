/**
 * IdeTabWatcher - Records IDE tab operations (open/close/switch)
 *
 * Components register callbacks that trigger event recording when:
 * - File explorer opens a new tab
 * - Editor switches active tab
 * - Editor closes a tab
 */

import { EventTypes } from '~/types/events';

type AddEventCallback = <P>(src: string, act: string, payload: P, timestamp?: number) => void;

export class IdeTabWatcher {
  private addEvent: AddEventCallback;

  constructor(addEvent: AddEventCallback) {
    this.addEvent = addEvent;
  }

  /**
   * Record a tab open event
   * Called by file-explorer when user opens a file
   * NOTE: Content is not recorded - it will be restored via Git checkout + typing events
   */
  recordTabOpen(filePath: string): void {
    this.addEvent('ui', EventTypes.IDE_TABS_OPEN, {
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
    this.addEvent('ui', EventTypes.IDE_TABS_CLOSE, {
      type: 'editor',
      path: filePath,
    });
    console.log(`[IdeTabWatcher] Tab closed: ${filePath}`);
  }

  /**
   * Record a tab switch event
   * Called by editor when user switches to a different tab
   * NOTE: Content is not recorded - it will be restored via Git checkout + typing events
   */
  recordTabSwitch(filePath: string): void {
    this.addEvent('ui', EventTypes.IDE_TABS_SWITCH, {
      type: 'editor',
      path: filePath,
    });
    console.log(`[IdeTabWatcher] Tab switched to: ${filePath}`);
  }
}
