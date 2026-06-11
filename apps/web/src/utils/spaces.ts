/**
 * The space id stored in auth state is `string | null` (from Redux persistence).
 * Convert to a numeric id for API calls, returning `null` for missing or
 * non-numeric values so callers can skip space-scoped requests rather than
 * silently hit the API with NaN.
 */
export const parseSpaceId = (spaceId: string | null): number | null => {
  // Number('') === 0 and Number('  ') === 0 in JS; treat both as missing.
  if (spaceId === null || spaceId.trim() === '') return null
  const parsed = Number(spaceId)
  return Number.isFinite(parsed) ? parsed : null
}
