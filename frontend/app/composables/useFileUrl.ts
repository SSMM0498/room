import type { RecordModel } from 'pocketbase';

/**
 * A composable to generate a URL to our server-side file proxy.
 * This is the new, safe way to display files in the client.
 *
 * @param record - The PocketBase record model containing the file.
 * @param filename - The name of the file field (e.g., 'avatar').
 * @param thumb - (Optional) A thumbnail size string (e.g., '100x100').
 * @returns A URL string pointing to our local file proxy.
 */
export const useFileUrl = (
  record: RecordModel | null | undefined,
  filename: string,
  thumb?: string
): string => {
  if (!record || !record[filename]) {
    return '';
  }

  let url = `/api/files/${record.collectionId}/${record.id}/${record[filename]}`;

  if (thumb) {
    url += `?thumb=${thumb}`;
  }

  return url;
};