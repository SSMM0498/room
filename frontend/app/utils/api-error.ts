/**
 * Extracts the human-readable message out of an error returned by a server route.
 * Nitro puts the `statusMessage` given to `createError` in the response body.
 */
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const data = (error as { data?: { statusMessage?: string; message?: string } } | null)?.data;
  return data?.statusMessage || data?.message || fallback;
};
