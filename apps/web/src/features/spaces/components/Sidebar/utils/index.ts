import { sameAddress } from '@safe-global/utils/utils/addresses'
import { countSeats, isSpaceAtSafeLimit, type SafeLimit } from '@/utils/spaces'

export const truncateSpaceName = (name: string, maxLength: number): string =>
  name.length > maxLength ? `${name.slice(0, maxLength)}...` : name

export const getSidebarItemTestId = (label: string): string =>
  `sidebar-item-${label.trim().toLowerCase().replace(/\s+/g, '-')}`

/** Action items are keyed by their stable id rather than their label, which is free to change. */
export const getSidebarActionItemTestId = (id: string): string => `sidebar-${id}-item`

/** Why a Workspace cannot take the Safe, in the order its tooltip is chosen; null when it can. */
export type AddToSpaceBlock = 'alreadyAdded' | 'notAdmin' | 'safeLimit' | null

type AddToSpaceCheck = {
  /** Safe addresses of the Workspace by chain ID; undefined while unknown. */
  spaceSafes: Record<string, string[]> | undefined
  /** Used only while `spaceSafes` is unknown. */
  safeCount: number
  limit: SafeLimit
  isAdmin: boolean
  chainId: string
  safeAddress: string
}

export const getAddToSpaceBlock = ({
  spaceSafes,
  safeCount,
  limit,
  isAdmin,
  chainId,
  safeAddress,
}: AddToSpaceCheck): AddToSpaceBlock => {
  const isSafe = (address: string) => sameAddress(address, safeAddress)
  if (spaceSafes?.[chainId]?.some(isSafe)) return 'alreadyAdded'
  if (!isAdmin) return 'notAdmin'

  const addresses = Object.values(spaceSafes ?? {}).flat()
  // Seats are per address: a Safe the Workspace already holds on another chain takes none.
  if (addresses.some(isSafe)) return null
  const seatCount = spaceSafes ? countSeats(addresses) : safeCount
  return isSpaceAtSafeLimit(seatCount, limit) ? 'safeLimit' : null
}
