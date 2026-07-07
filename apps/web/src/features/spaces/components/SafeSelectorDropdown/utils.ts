import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { SafeItemData } from './types'

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Names truncate via CSS (`truncate`) to the space actually available; the full name shows in a tooltip.
export const getSafeDisplayInfo = (name: string, address: string): { shortAddress: string; displayName: string } => {
  const shortAddress = shortenAddress(address)
  const displayName = name || shortAddress
  return { shortAddress, displayName }
}

/** Case-insensitive safe search on resolved name, address, and chain name/short name. */
export const matchesSafeSearch = (item: SafeItemData, displayName: string, query: string): boolean => {
  const name = displayName.toLowerCase()
  const address = item.address.toLowerCase()
  if (name.includes(query) || address.includes(query)) return true
  return item.chains.some(
    (chain) => chain.chainName?.toLowerCase().includes(query) || chain.shortName?.toLowerCase().includes(query),
  )
}
