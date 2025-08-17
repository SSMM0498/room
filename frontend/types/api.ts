import type { AuthModel } from 'pocketbase';

export interface AuthResponse {
  user: AuthModel | null;
}