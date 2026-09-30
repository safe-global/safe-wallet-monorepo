import { isMultiChainSafeItem, type AllSafeItems, type SafeItem } from '@/hooks/safes'
import type { SafeAppMockupAccount } from './types'

/**
 * Dedupes by address and falls back to `nameLookup` when a safe has no name —
 * the persisted Space rarely carries names, but the user's global address book does.
 */
export const deriveSidePanelAccountsFromSpace = (
  allSafes: AllSafeItems,
  nameLookup?: Map<string, string>,
): SafeAppMockupAccount[] => {
  const seen = new Set<string>()
  const accounts: SafeAppMockupAccount[] = []

  const resolveName = (address: string, name: string | undefined): string | undefined => {
    if (name && name.trim()) return name
    return nameLookup?.get(address.toLowerCase())
  }

  const pushOnce = (address: string, name: string | undefined, safeItem: SafeItem | undefined) => {
    const key = address.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    accounts.push({ address, name: resolveName(address, name), _safeItem: safeItem })
  }

  for (const safe of allSafes) {
    if (isMultiChainSafeItem(safe)) {
      pushOnce(safe.address, safe.name, safe.safes[0])
    } else {
      pushOnce(safe.address, safe.name, safe)
    }
  }

  return accounts
}
