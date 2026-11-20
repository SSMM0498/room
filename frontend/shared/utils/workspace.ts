/**
 * Kubernetes name of a workspace: its Deployment, Service and Ingress carry it.
 *
 * It is built from the record id, which is always a valid and unique resource
 * name. The bridge strips the `ws-` prefix to find the files in `workspaces/<id>`.
 */
export const workspaceK8sName = (workspaceId: string): string => `ws-${workspaceId}`;

/** A sub-domain also needs room for the `preview-` prefix within a 63-character DNS label. */
const MAX_SUBDOMAIN_LENGTH = 55;

/**
 * Whether a value can be used as the sub-domain of a workspace.
 *
 * `preview-…` is refused because those hosts serve the learner's own app: they
 * must never be mistaken for the host of a workspace, which is handed the
 * session of the signed-in user.
 */
export const isWorkspaceSubdomain = (value: string | null | undefined): value is string =>
    !!value
    && value.length <= MAX_SUBDOMAIN_LENGTH
    && /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value)
    && !value.startsWith('preview-');

/**
 * Sub-domain a workspace is reached on: `<sub-domain>.<WORKSPACE_DOMAIN>`.
 *
 * It is the workspace's name, which the course editor sets to the course slug, so
 * that the workspace of a course lives at `<course slug>.<domain>`. A name that
 * cannot be a sub-domain falls back to the Kubernetes name.
 */
export const workspaceSubdomain = (workspace: { id: string; name?: string | null }): string =>
    isWorkspaceSubdomain(workspace.name) ? workspace.name : workspaceK8sName(workspace.id);

/** The workspace sub-domain a hostname designates, or null on any other host. */
export const subdomainOfHost = (hostname: string, domain: string): string | null => {
    if (!hostname.endsWith(`.${domain}`)) return null;

    const subdomain = hostname.slice(0, -(domain.length + 1));
    return isWorkspaceSubdomain(subdomain) ? subdomain : null;
};

/**
 * Environments a workspace can run in. Each one has its own worker image with
 * the toolchain already installed (`docker/environments/<id>/`, built by
 * `make build-environments`) and its starter files in `templates/<id>/`.
 */
export const WORKSPACE_ENVIRONMENTS = [
    { id: 'golang', label: 'Go' },
] as const;

export type WorkspaceEnvironment = typeof WORKSPACE_ENVIRONMENTS[number]['id'];

export const isWorkspaceEnvironment = (value: unknown): value is WorkspaceEnvironment =>
    WORKSPACE_ENVIRONMENTS.some(environment => environment.id === value);

/**
 * Image of the worker container of a workspace. A workspace without an
 * environment runs the generic image, which only has a shell and Git.
 */
export const workerImage = (environment: unknown): string =>
    isWorkspaceEnvironment(environment) ? `mrsedok/worker-${environment}:latest` : 'mrsedok/worker-image:latest';
