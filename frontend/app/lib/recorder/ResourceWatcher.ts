/**
 * ResourceWatcher - Records file system operations
 *
 * Components register callbacks that trigger event recording when:
 * - User expands or collapses a folder
 * - User creates a new file or folder
 * - User deletes a file or folder
 * - User renames or moves a file or folder
 */

import type { Recorder } from './Recorder';
import { EventTypes } from '~/types/events';
import type { FilesExpandPayload, FilesCreatePayload, FilesDeletePayload, FilesMovePayload, FilesCreateInputShowPayload, FilesCreateInputTypePayload, FilesCreateInputHidePayload, FilesRenameInputShowPayload, FilesRenameInputTypePayload, FilesRenameInputHidePayload, FilesPopoverShowPayload, FilesPopoverHidePayload } from '~/types/events';

export class ResourceWatcher {
  private recorder: Recorder;

  constructor(recorder: Recorder) {
    this.recorder = recorder;
  }

  /**
   * Record a folder expand/collapse event
   * Called by file-explorer when user expands or collapses a folder
   */
  recordFolderExpand(
    path: string,
    expanded: boolean,
    content?: Array<{ name: string; path: string; type: 'file' | 'directory' }>
  ): void {
    this.recorder.addNewEvent<FilesExpandPayload>('files', EventTypes.FILES_EXPAND, {
      path,
      expanded,
      content,
    });
    console.log(`[ResourceWatcher] Folder ${expanded ? 'expanded' : 'collapsed'}: ${path}${content ? ` (${content.length} items)` : ''}`);
  }

  /**
   * Record a file/folder creation event
   * Called by file-explorer when user creates a new file or folder
   */
  recordCreate(path: string, type: 'f' | 'd'): void {
    this.recorder.addNewEvent<FilesCreatePayload>('files', EventTypes.FILES_CREATE, {
      path,
      type,
    });
    console.log(`[ResourceWatcher] ${type === 'f' ? 'File' : 'Folder'} created: ${path}`);
  }

  /**
   * Record a file/folder deletion event
   * Called by file-explorer when user deletes a file or folder
   */
  recordDelete(path: string): void {
    this.recorder.addNewEvent<FilesDeletePayload>('files', EventTypes.FILES_DELETE, {
      path,
    });
    console.log(`[ResourceWatcher] Resource deleted: ${path}`);
  }

  /**
   * Record a file/folder move/rename event
   * Called by file-explorer when user renames or moves a file or folder
   */
  recordMove(from: string, to: string): void {
    this.recorder.addNewEvent<FilesMovePayload>('files', EventTypes.FILES_MOVE, {
      from,
      to,
    });
    console.log(`[ResourceWatcher] Resource moved: ${from} -> ${to}`);
  }

  /**
   * Record the appearance of the resource creation input
   * Called when user clicks "New File" or "New Folder" button
   */
  recordCreateInputShow(type: 'file' | 'folder', parentPath: string): void {
    this.recorder.addNewEvent<FilesCreateInputShowPayload>('files', EventTypes.FILES_CREATE_INPUT_SHOW, {
      type,
      parentPath,
    });
    console.log(`[ResourceWatcher] Create input shown: ${type} in ${parentPath}`);
  }

  /**
   * Record typing in the resource creation input
   * Called as user types the resource name
   */
  recordCreateInputType(text: string): void {
    this.recorder.addNewEvent<FilesCreateInputTypePayload>('files', EventTypes.FILES_CREATE_INPUT_TYPE, {
      text,
    });
    console.log(`[ResourceWatcher] Create input typed: "${text}"`);
  }

  /**
   * Record hiding of the resource creation input
   * Called when input is dismissed (either by submit or cancel)
   */
  recordCreateInputHide(cancelled: boolean): void {
    this.recorder.addNewEvent<FilesCreateInputHidePayload>('files', EventTypes.FILES_CREATE_INPUT_HIDE, {
      cancelled,
    });
    console.log(`[ResourceWatcher] Create input hidden: ${cancelled ? 'cancelled' : 'submitted'}`);
  }

  /**
   * Record the appearance of the resource rename input
   * Called when user starts renaming a file or folder
   */
  recordRenameInputShow(path: string, currentName: string): void {
    this.recorder.addNewEvent<FilesRenameInputShowPayload>('files', EventTypes.FILES_RENAME_INPUT_SHOW, {
      path,
      currentName,
    });
    console.log(`[ResourceWatcher] Rename input shown: ${path} (${currentName})`);
  }

  /**
   * Record typing in the resource rename input
   * Called as user types the new resource name
   */
  recordRenameInputType(text: string): void {
    this.recorder.addNewEvent<FilesRenameInputTypePayload>('files', EventTypes.FILES_RENAME_INPUT_TYPE, {
      text,
    });
    console.log(`[ResourceWatcher] Rename input typed: "${text}"`);
  }

  /**
   * Record hiding of the resource rename input
   * Called when input is dismissed (either by submit or cancel)
   */
  recordRenameInputHide(cancelled: boolean): void {
    this.recorder.addNewEvent<FilesRenameInputHidePayload>('files', EventTypes.FILES_RENAME_INPUT_HIDE, {
      cancelled,
    });
    console.log(`[ResourceWatcher] Rename input hidden: ${cancelled ? 'cancelled' : 'submitted'}`);
  }

  /**
   * Record the appearance of the resource popover
   * Called when user clicks the "more" button to show context menu
   */
  recordPopoverShow(path: string): void {
    this.recorder.addNewEvent<FilesPopoverShowPayload>('files', EventTypes.FILES_POPOVER_SHOW, {
      path,
    });
    console.log(`[ResourceWatcher] Popover shown: ${path}`);
  }

  /**
   * Record hiding of the resource popover
   * Called when popover is closed
   */
  recordPopoverHide(path: string): void {
    this.recorder.addNewEvent<FilesPopoverHidePayload>('files', EventTypes.FILES_POPOVER_HIDE, {
      path,
    });
    console.log(`[ResourceWatcher] Popover hidden: ${path}`);
  }
}
