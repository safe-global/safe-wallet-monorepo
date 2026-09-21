/**
 * Normalize a Space UUID (string | null) for use as a Space identifier.
 * Returns null for missing/whitespace-only inputs so callers can skip
 * space-scoped requests rather than passing an empty id.
 */
export const normalizeSpaceId = (spaceId: string | null): string | null => {
  if (spaceId === null || spaceId.trim() === '') return null
  return spaceId
}
