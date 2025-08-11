import type { AuthModel } from 'pocketbase';
import { type AuthResponse } from '../../types/api'

export const useAuth = () => {
  const authUser = useAuthUser();

  const setUser = (user: AuthModel | null) => {
    authUser.value = user;
  };

  const setCookie = (cookie: any) => {
    cookie.value = cookie;
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


  // Expose the user state and auth functions
  return {
    setUser,
    me,
    login,
    register,
    logout
  };
};