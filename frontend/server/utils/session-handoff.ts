import { randomBytes } from 'node:crypto';

/**
 * One-time codes that carry a signed-in session from the main domain to a
 * workspace sub-domain.
 *
 * The session cookie is host-only. Browsers do not share cookies between
 * `localhost` and `<slug>.localhost`, and a cookie shared with every sub-domain
 * would also be sent to the preview hosts, which run the learner's own code. So
 * each workspace host receives its own copy of the session through a redirect:
 *
 *   main domain   GET /api/auth/handoff?to=<workspace page>   issues a code
 *   workspace     GET /api/auth/session?code=…&next=…         sets the cookie
 *
 * A code works once, for 30 seconds, and only on the host it was issued for.
 * Codes are kept in this process's memory, which is enough for a single server
 * instance; several instances would need a shared store.
 */
const TTL_MS = 30_000;

const pending = new Map<string, { cookie: string; hostname: string; expires: number }>();

/** Issues a code that lets `hostname` pick up the given session cookie. */
export function issueSessionHandoff(cookie: string, hostname: string): string {
    const now = Date.now();
    for (const [code, handoff] of pending) {
        if (handoff.expires < now) pending.delete(code);
    }

    const code = randomBytes(32).toString('base64url');
    pending.set(code, { cookie, hostname, expires: now + TTL_MS });
    return code;
}

/** Returns the session cookie a code stands for, or null if it cannot be used here. */
export function redeemSessionHandoff(code: string, hostname: string): string | null {
    const handoff = pending.get(code);
    if (!handoff) return null;

    pending.delete(code);
    return handoff.hostname === hostname && handoff.expires >= Date.now() ? handoff.cookie : null;
}
