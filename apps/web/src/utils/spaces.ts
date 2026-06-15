/**
 * Normalize the persisted `lastUsedSpace` value (string | null) for use as
 * a Space identifier (a UUID). Returns null for missing/whitespace-only inputs
 * so callers can skip space-scoped requests rather than passing an empty id,
 * and passes any non-empty string through unchanged.
 */
export const normalizeSpaceId = (spaceId: string | null): string | null => {
  if (spaceId === null || spaceId.trim() === '') return null
  return spaceId
}
