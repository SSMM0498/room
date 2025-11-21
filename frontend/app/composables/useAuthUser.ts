import type { UserModel } from "~~/types/api";

export const useAuthUser = () => {
  const config = useRuntimeConfig();
  const auth_key = config.public.APP_NAME + "_user";
  const currentUser = usePersistedState<UserModel | null>(auth_key, null);

  return currentUser;
};