import { sameAddress } from '@safe-global/utils/utils/addresses'
import { countSeats, isSpaceAtSafeLimit, type SafeLimit } from '@/utils/spaces'

export const truncateSpaceName = (name: string, maxLength: number): string =>
  name.length > maxLength ? `${name.slice(0, maxLength)}...` : name

export const getSidebarItemTestId = (label: string): string =>
  `sidebar-item-${label.trim().toLowerCase().replace(/\s+/g, '-')}`

/** Action items are keyed by their stable id rather than their label, which is free to change. */
export const getSidebarActionItemTestId = (id: string): string => `sidebar-${id}-item`

/** What selecting a Workspace does with the Safe, in the order its tooltip is chosen. */
export type AddToSpaceStatus = 'available' | 'alreadyAdded' | 'notAdmin' | 'noPlan' | 'safeLimit'

type AddToSpaceCheck = {
  /** Safe addresses of the Workspace by chain ID; undefined while unknown. */
  spaceSafes: Record<string, string[]> | undefined
  /** Used only while `spaceSafes` is unknown. */
  safeCount: number
  limit: SafeLimit
  /** Undefined while unknown. */
  hasPlan: boolean | undefined
  isAdmin: boolean
  chainId: string
  safeAddress: string
}

export const getAddToSpaceStatus = ({
  spaceSafes,
  safeCount,
  limit,
  hasPlan,
  isAdmin,
  chainId,
  safeAddress,
}: AddToSpaceCheck): AddToSpaceStatus => {
  const isSafe = (address: string) => sameAddress(address, safeAddress)
  if (spaceSafes?.[chainId]?.some(isSafe)) return 'alreadyAdded'
  if (!isAdmin) return 'notAdmin'
  if (hasPlan === false) return 'noPlan'

  const addresses = Object.values(spaceSafes ?? {}).flat()
  // Seats are per address: a Safe the Workspace already holds on another chain takes none.
  if (addresses.some(isSafe)) return 'available'
  const seatCount = spaceSafes ? countSeats(addresses) : safeCount
  return isSpaceAtSafeLimit(seatCount, limit) ? 'safeLimit' : 'available'
}
