/**
 * Normalize the persisted `lastUsedSpace` value (string | null) for use as
 * a Space identifier. Returns null for missing/whitespace-only inputs so
 * callers can skip space-scoped requests rather than passing an empty id.
 * The identifier is a UUID; legacy numeric strings are still accepted by
 * the backend's LegacySpaceIdPipe during the deprecation window, so we
 * pass any non-empty string through unchanged.
 */
export const normalizeSpaceId = (spaceId: string | null): string | null => {
  if (spaceId === null || spaceId.trim() === '') return null
  return spaceId
}
