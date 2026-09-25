/**
 * Normalize a Space UUID (string | null) for use as a Space identifier.
 * Returns null for missing/whitespace-only inputs so callers can skip
 * space-scoped requests rather than passing an empty id.
 */
export const normalizeSpaceId = (spaceId: string | null): string | null => {
  if (spaceId === null || spaceId.trim() === '') return null
  return spaceId
}

/** A Workspace's Safe account cap: `null` is unlimited, `undefined` is not known yet (loading or failed). */
export type SafeLimit = number | null | undefined

/** False when the count or the limit is unknown, or the plan is unlimited. */
export const isSpaceAtSafeLimit = (safeCount: number | undefined, limit: SafeLimit): boolean =>
  safeCount !== undefined && typeof limit === 'number' && safeCount >= limit

/** The address of a `chainId:address` Safe key. */
export const addressOfSafeKey = (key: string): string => key.slice(key.indexOf(':') + 1)

/** Seats are per Safe address: the same Safe deployed on several chains takes one. */
export const countSeats = (addresses: Iterable<string>): number =>
  new Set(Array.from(addresses, (address) => address.toLowerCase())).size
