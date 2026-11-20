/**
 * Send the signed-in user to a page on a workspace sub-domain
 * GET /api/auth/handoff?to=<absolute url of the page>
 *
 * Called on the main domain. See `server/utils/session-handoff.ts`.
 */
export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    if (!config.public.IDE_ON_SUBDOMAIN) {
        throw createError({ statusCode: 404, statusMessage: 'Not found.' });
    }

    // The code must only ever travel to this server, on the host of a workspace:
    // never to a preview host or to another service listening on the machine.
    let target: URL | null = null;
    try {
        target = new URL(String(getQuery(event).to ?? ''));
    } catch {
        // Handled below.
    }
    const here = getRequestURL(event);
    if (
        !target
        || target.protocol !== here.protocol
        || target.port !== here.port
        || !subdomainOfHost(target.hostname, config.public.WORKSPACE_DOMAIN)
    ) {
        throw createError({ statusCode: 400, statusMessage: 'Invalid workspace address.' });
    }

    setResponseHeader(event, 'Cache-Control', 'no-store');

    const pb = await createPocketBaseInstance(event);
    if (!pb.authStore.isValid) {
        // The session cookie is SameSite=Strict: the browser withholds it when this
        // address is opened from another site, which a workspace sub-domain is. No
        // cookie therefore does not mean "signed out" yet. Asking once more from a
        // page of this origin makes the request same-site, and the cookie comes along.
        if (getQuery(event).retry === undefined) {
            const retry = `${here.pathname}?to=${encodeURIComponent(target.href)}&retry=1`;
            setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8');
            return `<!doctype html><meta charset="utf-8"><title>Opening the workspace…</title>`
                + `<script>location.replace(${JSON.stringify(retry)})</script>`
                + `<noscript><meta http-equiv="refresh" content="0;url=${retry}"></noscript>`;
        }
        return sendRedirect(event, '/login');
    }

    const code = issueSessionHandoff(pb.authStore.exportToCookie(sessionCookieOptions()), target.hostname);
    const next = encodeURIComponent(target.pathname + target.search);
    return sendRedirect(event, `${target.origin}/api/auth/session?code=${code}&next=${next}`);
});
