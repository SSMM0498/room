import type { AuthModel } from 'pocketbase';
import { type AuthResponse, type UserModel } from '../../types/api'

export const useAuth = () => {
  const authUser = useAuthUser();

  const setUser = (user: UserModel | null) => {
    authUser.value = user;
  };

  /**
   * Logs in the user by calling our server API endpoint.
   * @param credentials - The user's email and password.
   * @returns The authenticated user model.
   */
  const login = async (credentials: { email?: string; password?: string }) => {
    const response = await $fetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: credentials,
    });
    setUser(response.user);
    return response.user;
  };

  /**
   * Registers a new user by calling our server API endpoint.
   * @param details - The user's details for registration.
   * @returns The newly created user model.
  */
  const register = async (details: Record<string, any>) => {
    const response = await $fetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: details,
    });
    setUser(response.user);
    return response.user;
  };

  /**
   * Logs out the current user by calling the server endpoint.
  */
  const logout = async () => {
    await $fetch('/api/auth/logout', {
      method: 'POST',
    });
    setUser(null);
  };

  /**
   * Fetches the current user from the server to validate the session.
   * This is the key to synchronizing the client state with the server.
   */
  const me = async (): Promise<AuthModel | null> => {
    try {
      const response = await $fetch<AuthResponse>('/api/auth/me');
      // Update the local persisted state with the fresh user data from the server.
      setUser(response.user);
      return response.user;
    } catch (error) {
      // If the /me endpoint fails (e.g., 401 Unauthorized), it means the cookie is invalid.
      // Ensure the local state is cleared.
      setUser(null);
      return null;
    }
  };

  /**
   * Updates the user's profile information (name and/or avatar).
   * @param data - The new profile data containing name and/or avatar file.
   * @returns The updated user model.
   */
  const updateProfile = async (data: { name?: string; avatar?: File }) => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.avatar) formData.append('avatar', data.avatar);

    const response = await $fetch<AuthResponse>('/api/auth/profile', {
      method: 'PATCH',
      body: formData,
    });
    setUser(response.user);
    return response.user;
  };

  /**
   * Updates the user's password.
   * @param passwords - An object containing the old password, new password, and confirmation.
   * * This function does not return the updated user model, as the response is not needed.
   */
  const changePassword = async (passwords: Record<string, any>) => {
    // We don't need the response, but fetching it confirms success.
    await $fetch<AuthResponse>('/api/auth/change-password', {
      method: 'POST',
      body: passwords,
    });
  };

  /**
   * Sends a request to change the user's email address.
   * @param newEmail - The new email address to request.
   * @returns A success message indicating the request was sent.
   */
  const requestEmailChange = async (newEmail: string) => {
    return await $fetch<{ success: boolean; message: string }>('/api/auth/request-email-change', {
      method: 'POST',
      body: { newEmail },
    });
  };

  /**
   * Permanently deletes the user's account.
   */
  const deleteAccount = async () => {
    const response = await $fetch('/api/auth/delete-account', {
      method: 'DELETE',
    });
    // On success, clear local state and redirect
    setUser(null);
    await navigateTo('/');
    return response;
  };


  // Expose the user state and auth functions
  return {
    setUser,
    me,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestEmailChange,
    deleteAccount
  };
};