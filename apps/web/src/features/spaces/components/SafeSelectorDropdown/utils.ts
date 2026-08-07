import type { SafeItemData } from './types'

/** Case-insensitive safe search on resolved name, address, and chain name/short name. */
export const matchesSafeSearch = (item: SafeItemData, displayName: string, query: string): boolean => {
  const name = displayName.toLowerCase()
  const address = item.address.toLowerCase()
  if (name.includes(query) || address.includes(query)) return true
  return item.chains.some(
    (chain) => chain.chainName?.toLowerCase().includes(query) || chain.shortName?.toLowerCase().includes(query),
  )
}
