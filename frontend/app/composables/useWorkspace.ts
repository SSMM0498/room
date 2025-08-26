import { ref } from 'vue';
import { type RecordModel } from 'pocketbase';

export const useWorkspace = () => {
  const currentWorkspace = ref<RecordModel | null>(null);
  const isStarting = ref(false);
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

  const fetchWorkspaceByCourse = async (courseId: string) => {
    error.value = null;
    try {
      const workspace = await $fetch<RecordModel>(`/api/workspaces/by-course/${courseId}`);
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
    error,
    createWorkspace,
    startWorkspace,
    fetchWorkspaceByCourse,
  };
};