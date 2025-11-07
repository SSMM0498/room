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
import type { FilesExpandPayload, FilesCreatePayload, FilesDeletePayload, FilesMovePayload } from '~/types/events';

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
}
