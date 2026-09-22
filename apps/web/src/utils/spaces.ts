/**
 * Normalize a Space UUID (string | null) for use as a Space identifier.
 * Returns null for missing/whitespace-only inputs so callers can skip
 * space-scoped requests rather than passing an empty id.
 */
export const normalizeSpaceId = (spaceId: string | null): string | null => {
  if (spaceId === null || spaceId.trim() === '') return null
  return spaceId
}

/** False when the count is unknown or the plan is unlimited (`limit === null`). */
export const isSpaceAtSafeLimit = (safeCount: number | undefined, limit: number | null): boolean =>
  safeCount !== undefined && limit !== null && safeCount >= limit
