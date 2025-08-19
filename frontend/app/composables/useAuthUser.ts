import type { UserModel } from "~~/types/api";

export const useAuthUser = () => {
  const currentUser = usePersistedState<UserModel | null>("user", null);

  return currentUser;
};