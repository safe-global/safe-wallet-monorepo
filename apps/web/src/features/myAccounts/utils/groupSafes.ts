import { type AllSafeItems, type MultiChainSafeItem, type SafeItem, isMultiChainSafeItem } from '@/hooks/safes'

export type GroupedSafes = {
  trusted: AllSafeItems
  owned: AllSafeItems
  local: AllSafeItems
}

/** A safe is "owned" if the connected wallet signs for it on at least one chain. */
const isOwnedItem = (item: SafeItem | MultiChainSafeItem): boolean =>
  isMultiChainSafeItem(item) ? item.safes.some((safe) => !safe.isReadOnly) : !item.isReadOnly

/** Lowercased address set, used to exclude Workspace safes from the other buckets. */
export const buildAddressSet = (items: AllSafeItems): Set<string> =>
  new Set(items.map((item) => item.address.toLowerCase()))

/**
 * Splits the global safe list into the Trusted / Owned / Local Storage buckets for the
 * unified accounts table. Workspace safes are rendered separately and excluded here.
 *
 * Each safe lands in exactly one bucket by precedence: Workspace › Trusted › Owned › Local.
 * The Owned bucket is only populated when a wallet is connected.
 */
export const groupSafesByPrecedence = (
  global: AllSafeItems,
  workspaceAddresses: Set<string>,
  isConnected: boolean,
): GroupedSafes => {
  const trusted: AllSafeItems = []
  const owned: AllSafeItems = []
  const local: AllSafeItems = []

  for (const item of global) {
    if (workspaceAddresses.has(item.address.toLowerCase())) continue

    if (item.isPinned) {
      trusted.push(item)
    } else if (isConnected && isOwnedItem(item)) {
      owned.push(item)
    } else {
      local.push(item)
    }
  }

  return { trusted, owned, local }
}
