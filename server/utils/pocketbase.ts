import PocketBase from 'pocketbase';
import { type H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';

export const createPocketBaseInstance = (event: H3Event) => {
  const config = useRuntimeConfig();

  if (!config.POCKETBASE_URL) {
    throw new Error('POCKETBASE_URL is not defined in the environment.');
  }

  const pb = new PocketBase(config.POCKETBASE_URL);

  const authCookie = getCookie(event, 'pb_auth');

  if (authCookie) {
    try {
      pb.authStore.loadFromCookie(authCookie);
    } catch (error) {
      pb.authStore.clear();
      deleteCookie(event, 'pb_auth');
    }
  }

  pb.authStore.onChange(() => {
    setCookie(event, 'pb_auth', pb.authStore.exportToCookie({
      httpOnly: true,
      secure: true,
      sameSite: 'lax', 
      maxAge: 604800, // Optional: ~7 days
    }));
  });

  if (pb.authStore.isValid) {
    try {
      pb.collection('users').authRefresh();
    } catch (_) {
      pb.authStore.clear();
      deleteCookie(event, 'pb_auth');
    }
  }
  
  return pb;
};