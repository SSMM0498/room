/**
 * Addresses of the IDE when it is served on workspace sub-domains
 * (`IDE_ON_SUBDOMAIN`): the IDE of a course then lives at
 * `<course slug>.<WORKSPACE_DOMAIN>/teach/`, next to its workspace, while every
 * other page stays on the main domain.
 */
export const useWorkspaceHost = () => {
  const { IDE_ON_SUBDOMAIN, WORKSPACE_DOMAIN } = useRuntimeConfig().public;
  const nuxt = useNuxtApp();

  const enabled = Boolean(IDE_ON_SUBDOMAIN) && import.meta.client;

  /** Sub-domain of the workspace the current page is served on, null on the main domain. */
  const currentSubdomain = (): string | null =>
    enabled ? subdomainOfHost(window.location.hostname, WORKSPACE_DOMAIN) : null;

  const port = () => (window.location.port ? `:${window.location.port}` : '');

  /** Origin of the main domain, where every page but the IDE lives. */
  const mainOrigin = (): string =>
    currentSubdomain() ? `${window.location.protocol}//${WORKSPACE_DOMAIN}${port()}` : window.location.origin;

  /**
   * Address of the IDE of a course on its own sub-domain.
   *
   * The path is built from the locale root rather than from `localePath('/teach')`,
   * which resolves to the route's canonical `/teach/<slug>` form.
   */
  const ideUrl = (slug: string): string => {
    const localeRoot = nuxt.$localePath('/').replace(/\/$/, '');
    return `${window.location.protocol}//${slug}.${WORKSPACE_DOMAIN}${port()}${localeRoot}/teach/`;
  };

  /**
   * Address to navigate to in order to open the IDE of a course: it goes through
   * the main domain, which hands the session over to the sub-domain.
   */
  const ideEntryUrl = (slug: string): string =>
    `${mainOrigin()}/api/auth/handoff?to=${encodeURIComponent(ideUrl(slug))}`;

  return { enabled, currentSubdomain, mainOrigin, ideUrl, ideEntryUrl };
};
