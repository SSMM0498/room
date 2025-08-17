import { type AuthModel } from 'pocketbase';

export const useAuthUser = () => {
  const currentUser = usePersistedState<AuthModel | null>("user", null);

  return currentUser;
};