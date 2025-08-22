import type { AuthModel } from 'pocketbase';

export type UserModel = AuthModel & {
  username: string;
  school?: any;
}

export interface AuthResponse {
  user: UserModel | null;
}