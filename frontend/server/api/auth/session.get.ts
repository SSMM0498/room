/**
 * Pick up, on a workspace sub-domain, the session handed over by the main domain
 * GET /api/auth/session?code=<one-time code>&next=<path to open>
 *
 * See `server/utils/session-handoff.ts`.
 */
export default defineEventHandler((event) => {
    const config = useRuntimeConfig();
    const { code, next } = getQuery(event);

    const cookie = redeemSessionHandoff(String(code ?? ''), getRequestURL(event).hostname);
    if (!cookie) {
        throw createError({ statusCode: 400, statusMessage: 'This sign-in link has expired. Open the course again.' });
    }

    setCookie(event, config.COOKIE_NAME, cookie, sessionCookieOptions());

    // Only ever redirect within this host.
    const path = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/';
    return sendRedirect(event, path);
});
