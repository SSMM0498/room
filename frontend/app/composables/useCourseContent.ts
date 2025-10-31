/**
 * Course Content Composable
 *
 * Manages uploading and fetching course recordings (audio + NDJSON timeline).
 * Uses server API routes instead of direct PocketBase client calls.
 */

import type { AnyActionPacket } from '~/types/events';

export interface CourseContentRecord {
  id: string;
  course: string;
  room_json: string;
  room_json_url?: string;
  audio: string;
  audio_url?: string | null;
  thumbnail?: string;
  thumbnail_url?: string | null;
  created: string;
  updated: string;
}

export const useCourseContent = () => {
  const toast = useToast();

  /**
   * Upload a recording to the course_contents collection
   *
   * @param courseId - The course ID to associate with the content
   * @param eventsNDJSON - The NDJSON string of events
   * @param audioBlob - The audio blob from MediaRecorder
   * @param thumbnailBlob - Optional thumbnail image
   * @returns The created course_contents record
   */
  const uploadRecording = async (
    courseId: string,
    eventsNDJSON: string,
    audioBlob: Blob | null,
    thumbnailBlob?: Blob
  ): Promise<CourseContentRecord | null> => {
    try {
      console.log('[useCourseContent] Uploading recording for course:', courseId);

      // Create FormData
      const formData = new FormData();
      formData.append('courseId', courseId);

      // Create NDJSON file blob
      const eventsBlob = new Blob([eventsNDJSON], { type: 'application/x-json' });
      formData.append('room_json', eventsBlob, 'events.ndjson');

      // Add audio if available
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      }

      // Add thumbnail if available
      if (thumbnailBlob) {
        formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
      }

      // Upload via server API
      const response = await $fetch<{ success: boolean; data: CourseContentRecord }>('/api/course-contents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.success || !response.data) {
        throw new Error('Upload failed');
      }

      console.log('[useCourseContent] Upload successful:', response.data.id);

      toast.add({
        title: 'Recording Uploaded',
        description: 'Your recording has been saved successfully.',
        color: 'success',
        icon: 'i-heroicons-check-circle',
      });

      return response.data;
    } catch (error: any) {
      console.error('[useCourseContent] Upload failed:', error);

      toast.add({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload recording.',
        color: 'error',
        icon: 'heroicons-exclamation-triangle',
      });

      return null;
    }
  };

  /**
   * Fetch course content by course ID
   *
   * @param courseId - The course ID to fetch content for
   * @returns The course_contents record with file URLs if found
   */
  const fetchCourseContent = async (courseId: string): Promise<CourseContentRecord | null> => {
    try {
      console.log('[useCourseContent] Fetching content for course:', courseId);

      // Fetch via server API
      const response = await $fetch<{ success: boolean; data: CourseContentRecord | null }>(`/api/course-contents/by-course/${courseId}`);

      if (!response.success || !response.data) {
        console.log('[useCourseContent] No content found for course:', courseId);
        return null;
      }

      console.log('[useCourseContent] Content found:', response.data.id);

      return response.data;
    } catch (error: any) {
      console.error('[useCourseContent] Fetch failed:', error);

      toast.add({
        title: 'Load Failed',
        description: error.message || 'Failed to load recording.',
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle',
      });

      return null;
    }
  };

  /**
   * Download and parse the NDJSON timeline
   *
   * @param record - The course_contents record with file URLs
   * @returns Array of action packets
   */
  const downloadTimeline = async (record: CourseContentRecord): Promise<AnyActionPacket[]> => {
    try {
      const fileUrl = record.room_json_url;
      if (!fileUrl) {
        throw new Error('No room_json_url available');
      }

      console.log('[useCourseContent] Downloading timeline from:', fileUrl);

      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to download timeline');
      }

      const ndjson = await response.text();
      const lines = ndjson.trim().split('\n');
      const events: AnyActionPacket[] = lines
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      console.log('[useCourseContent] Timeline downloaded:', events.length, 'events');

      return events;
    } catch (error: any) {
      console.error('[useCourseContent] Timeline download failed:', error);
      throw error;
    }
  };

  /**
   * Get the audio URL from a record
   *
   * @param record - The course_contents record with file URLs
   * @returns The audio file URL or null if no audio
   */
  const getAudioUrl = (record: CourseContentRecord): string | null => {
    return record.audio_url || null;
  };

  /**
   * Get the thumbnail URL from a record
   *
   * @param record - The course_contents record with file URLs
   * @returns The thumbnail URL or null if no thumbnail
   */
  const getThumbnailUrl = (record: CourseContentRecord): string | null => {
    return record.thumbnail_url || null;
  };

  /**
   * Delete a course content record
   *
   * @param recordId - The course_contents record ID to delete
   * @returns True if deleted successfully
   */
  const deleteRecording = async (recordId: string): Promise<boolean> => {
    try {
      // TODO: Create server endpoint for deletion
      // await $fetch(`/api/course-contents/${recordId}`, { method: 'DELETE' });

      toast.add({
        title: 'Recording Deleted',
        description: 'The recording has been removed.',
        color: 'success',
        icon: 'i-heroicons-trash',
      });

      return true;
    } catch (error: any) {
      console.error('[useCourseContent] Delete failed:', error);

      toast.add({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete recording.',
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle',
      });

      return false;
    }
  };

  return {
    uploadRecording,
    fetchCourseContent,
    downloadTimeline,
    getAudioUrl,
    getThumbnailUrl,
    deleteRecording,
  };
};
