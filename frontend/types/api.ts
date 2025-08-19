import type { AuthModel } from 'pocketbase';

export type UserModel = AuthModel & {
  username: string;
}

export interface AuthResponse {
  user: UserModel | null;
}