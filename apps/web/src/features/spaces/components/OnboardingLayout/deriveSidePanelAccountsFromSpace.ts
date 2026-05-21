import { isMultiChainSafeItem, type AllSafeItems, type SafeItem } from '@/hooks/safes'
import type { SafeAppMockupAccount } from './SafeAppMockup'

/**
 * Derives the mockup side-panel's Accounts widget rows from a Space's persisted safes.
 *
 * - Dedupes by address: the same Safe on multiple chains shows once.
 * - For a `MultiChainSafeItem`, picks an arbitrary sub-`SafeItem` so the per-row
 *   `useSafeCardData` call inside `SafeAppMockup` can fetch a live fiat value.
 * - If `nameLookup` is supplied, it is used as a fallback for names that are
 *   missing on the persisted safe (Space's own address book is often empty,
 *   while the user's global address book carries the real names).
 *
 * Used by all four onboarding steps to populate the mockup with persisted state
 * when the user navigates back from a later step.
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
