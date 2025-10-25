import { ref } from 'vue';
import { type RecordModel } from 'pocketbase';

export const useWorkspace = () => {
  const currentWorkspace = ref<RecordModel | null>(null);
  const isStarting = ref(false);
  const progressMessage = ref('');
  const error = ref<Error | null>(null);

  /**
   * Creates a new workspace record in PocketBase and copies the MinIO template.
   */
  const createWorkspace = async (data: { name: string; language: string, course: string }) => {
    error.value = null;
    try {
      const newWorkspace = await $fetch<RecordModel>('/api/workspace', {
        method: 'POST',
        body: data,
      });
      currentWorkspace.value = newWorkspace;
      return newWorkspace;
    } catch (err: any) {
      error.value = err;
      return null;
    }
  };

  /**
   * Triggers the Kubernetes deployment for a given workspace.
   */
  const startWorkspace = async (workspaceId: string) => {
    error.value = null;
    isStarting.value = true;
    try {
      const response = await $fetch<{ success: boolean; message: string; url: string }>('/api/workspace/start', {
        method: 'POST',
        body: { workspaceId },
      });
      // After a successful start, you might want to refetch the workspace to get the 'active' status
      const updatedWorkspace = await $fetch<RecordModel>(`/api/workspaces/${workspaceId}`); // Assuming you have a get-by-id endpoint
      currentWorkspace.value = updatedWorkspace;
      return response;
    } catch (err: any) {
      error.value = err;
      return null;
    } finally {
      isStarting.value = false;
    }
  };

  /**
     * NEW: Checks if the workspace for a course is active, and starts it if not.
     * This is the primary function the UI will call.
     * @param courseId The ID of the course.
     * @returns The active workspace record, or null if it fails.
     */
  const ensureWorkspaceIsRunning = async (courseId: string): Promise<RecordModel | null> => {
    error.value = null;
    isStarting.value = true;

    try {
      // 1. Find the workspace linked to the course.
      progressMessage.value = 'Locating workspace...';
      const workspace = await fetchWorkspaceByCourse(courseId);

      if (!workspace) {
        throw new Error('No workspace is associated with this course.');
      }

      // 2. Check its status. If it's already active, we're done.
      if (workspace.status === 'running') {
        progressMessage.value = 'Workspace is already active!';
        isStarting.value = false;
        return workspace;
      }

      // 3. If not active, call the start endpoint.
      progressMessage.value = 'Workspace is sleeping. Waking it up...';
      const startResult = await startWorkspace(workspace.id);

      progressMessage.value = 'Workspace is ready!';
      isStarting.value = false;
      return currentWorkspace.value; // startWorkspace updates the currentWorkspace ref

    } catch (err: any) {
      error.value = err;
      isStarting.value = false;
      progressMessage.value = `Error: ${err.message}`;
      return null;
    }
  };

  const fetchWorkspaceByCourse = async (courseId: string) => {
    error.value = null;
    try {
      const workspace = await $fetch<RecordModel>(`/api/workspace/by-course/${courseId}`);
      currentWorkspace.value = workspace;
      return workspace;
    } catch (err: any) {
      error.value = err;
      currentWorkspace.value = null;
      return null;
    }
  };

  return {
    currentWorkspace,
    isStarting,
    progressMessage,
    error,
    createWorkspace,
    startWorkspace,
    fetchWorkspaceByCourse,
    ensureWorkspaceIsRunning,
  };
};