import type { EntitlementsResponse } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'

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

/** Undefined while the entitlements of the Workspace are unknown; always true without Safe Pro. */
export const hasSpacePlan = (
  isSafePro: boolean,
  entitlements: EntitlementsResponse | undefined,
): boolean | undefined => {
  if (!isSafePro) return true
  return entitlements ? entitlements.plan !== null : undefined
}

export type SafeWorkspacePick =
  { kind: 'none' } | { kind: 'one'; spaceId: string } | { kind: 'choose'; spaceIds: string[] }

/**
 * The Workspace to open a Safe in: its only Workspace, else its only Workspace with a plan,
 * else the user chooses. An unknown plan counts as no plan.
 */
export const pickSafeWorkspace = (
  spaceIds: string[],
  hasPlan: (spaceId: string) => boolean | undefined,
): SafeWorkspacePick => {
  if (spaceIds.length === 0) return { kind: 'none' }
  if (spaceIds.length === 1) return { kind: 'one', spaceId: spaceIds[0] }

  const withPlan = spaceIds.filter((spaceId) => hasPlan(spaceId) === true)
  return withPlan.length === 1 ? { kind: 'one', spaceId: withPlan[0] } : { kind: 'choose', spaceIds }
}
