/**
 * IdeTabWatcher - Records IDE tab operations (open/close/switch)
 *
 * Components register callbacks that trigger event recording when:
 * - File explorer opens a new tab
 * - Editor switches active tab
 * - Editor closes a tab
 */

import type { Recorder } from './Recorder';
import { EventTypes } from '~/types/events';

export class IdeTabWatcher {
  private recorder: Recorder;

  constructor(recorder: Recorder) {
    this.recorder = recorder;
  }

  /**
   * Record a tab open event
   * Called by file-explorer when user opens a file
   */
  recordTabOpen(filePath: string, content: string): void {
    this.recorder.addNewEvent('ui', EventTypes.IDE_TABS_OPEN, {
      type: 'editor',
      path: filePath,
      content: content,
    });
    console.log(`[IdeTabWatcher] Tab opened: ${filePath}`);
  }

  /**
   * Record a tab close event
   * Called by editor when user closes a tab
   */
  recordTabClose(filePath: string): void {
    this.recorder.addNewEvent('ui', EventTypes.IDE_TABS_CLOSE, {
      type: 'editor',
      path: filePath,
    });
    console.log(`[IdeTabWatcher] Tab closed: ${filePath}`);
  }

  /**
   * Record a tab switch event
   * Called by editor when user switches to a different tab
   */
  recordTabSwitch(filePath: string, content: string): void {
    this.recorder.addNewEvent('ui', EventTypes.IDE_TABS_SWITCH, {
      type: 'editor',
      path: filePath,
      content: content,
    });
    console.log(`[IdeTabWatcher] Tab switched to: ${filePath}`);
  }
}
