import type { SafeLimit } from '@safe-global/views/features/spaces/components/SelectedCounter/types'

export type { SafeLimit } from '@safe-global/views/features/spaces/components/SelectedCounter/types'

/** False when the count or the limit is unknown, or the plan is unlimited. */
export const isSpaceAtSafeLimit = (safeCount: number | undefined, limit: SafeLimit): boolean =>
  safeCount !== undefined && typeof limit === 'number' && safeCount >= limit

/** The address of a `chainId:address` Safe key. */
export const addressOfSafeKey = (key: string): string => key.slice(key.indexOf(':') + 1)

/** Seats are per Safe address: the same Safe deployed on several chains takes one. */
export const countSeats = (addresses: Iterable<string>): number =>
  new Set(Array.from(addresses, (address) => address.toLowerCase())).size
