import PocketBase from 'pocketbase';
import { type H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';

export const createPocketBaseInstance = async (event: H3Event) => {
  const config = useRuntimeConfig();
  const now = new Date();

  if (!config.POCKETBASE_URL || !config.COOKIE_NAME) {
    throw new Error('POCKETBASE_URL is not defined in the environment.');
  }

  const pb = new PocketBase(config.POCKETBASE_URL);

  const authCookie = getCookie(event, config.COOKIE_NAME);

  if (!authCookie) {
    pb.authStore.clear();
    deleteCookie(event, config.COOKIE_NAME);
  } else {
    try {
      pb.authStore.loadFromCookie(authCookie);

      if (pb.authStore.token && pb.authStore.isValid) {
        const tokenExpiry = pb.authStore.record ? new Date(pb.authStore.record.exp * 1000) : null;
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        if (tokenExpiry && tokenExpiry < fiveMinutesFromNow) {
          await pb.collection('users').authRefresh();
        }
      } else if (pb.authStore.token) {
        await pb.collection('users').authRefresh();
      }
    } catch (refreshError) {
      console.log("Auth refresh failed, clearing session:", refreshError)
      pb.authStore.clear();
      deleteCookie(event, config.COOKIE_NAME);

      event.context.authFailed = true
    }
  }

  pb.authStore.onChange(() => {
    if (pb.authStore.isValid) {
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict" as const,
        expires: new Date(now.getTime() + 60 * 60 * 24 * 7 * 1000), // 1 week
        path: '/',
      }
      const cookie = pb.authStore.exportToCookie(cookieOptions)
      setCookie(event, config.COOKIE_NAME, cookie, cookieOptions);
    } else {
      deleteCookie(event, config.COOKIE_NAME);
    }
  });

  return pb;
};