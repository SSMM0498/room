/** Remembers, per tab, that a session hand-off was just attempted, to never loop on it. */
const HANDOFF_ATTEMPT_KEY = 'room_handoff_attempt';

const attemptedHandoffRecently = (): boolean => {
  try {
    return Date.now() - Number(sessionStorage.getItem(HANDOFF_ATTEMPT_KEY) || 0) < 15_000;
  } catch {
    return true;
  }
};

const rememberHandoffAttempt = () => {
  try {
    sessionStorage.setItem(HANDOFF_ATTEMPT_KEY, String(Date.now()));
  } catch {
    // Without storage the attempt is simply not retried.
  }
};

/**
 * Keeps the IDE of a course on the workspace's own sub-domain and every other
 * page on the main domain (see `useWorkspaceHost`):
 *
 * - `/teach/<slug>` opened anywhere else moves to `<slug>.<domain>/teach/`;
 * - the IDE opened on its sub-domain without a session asks the main domain
 *   for it;
 * - any other page opened on a workspace sub-domain moves back to the main domain.
 */
export default defineNuxtRouteMiddleware((to) => {
  const { enabled, currentSubdomain, mainOrigin, ideEntryUrl } = useWorkspaceHost();
  if (!enabled) return;

  const here = currentSubdomain();

  if (!to.meta.workspaceIde) {
    if (here) return navigateTo(`${mainOrigin()}${to.fullPath}`, { external: true });
    return;
  }

  const slug = (to.params.slug as string | undefined) || here;
  if (!isWorkspaceSubdomain(slug)) return;

  const signedIn = Boolean(useAuthUser().value);
  if (slug !== here || (!signedIn && !attemptedHandoffRecently())) {
    rememberHandoffAttempt();
    return navigateTo(ideEntryUrl(slug), { external: true });
  }
});
