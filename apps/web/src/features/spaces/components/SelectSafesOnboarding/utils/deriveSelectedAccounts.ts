import { flattenSafeItems, isMultiChainSafeItem, type AllSafeItems, type SafeItem } from '@/hooks/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SafeAppMockupAccount } from '@/features/spaces/components/OnboardingLayout/mockup/types'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../constants'

// Dedupes by address: a Safe deployed on multiple chains appears once.
export const deriveSidePanelAccounts = (
  selectedSafes: Record<string, boolean>,
  allSafes: AllSafeItems,
): SafeAppMockupAccount[] => {
  const seen = new Set<string>()
  const accounts: SafeAppMockupAccount[] = []

  for (const [key, isSelected] of Object.entries(selectedSafes)) {
    if (!isSelected) continue
    // Sub-safe keys carry the real chain:address; the parent key is a UI grouping only.
    if (key.startsWith(MULTICHAIN_SAFE_KEY_PREFIX)) continue

    const colonIdx = key.indexOf(':')
    if (colonIdx === -1) continue
    const chainId = key.slice(0, colonIdx)
    const address = key.slice(colonIdx + 1)

    if (seen.has(address.toLowerCase())) continue
    seen.add(address.toLowerCase())

    let name: string | undefined
    let safeItem: SafeItem | undefined

    for (const safe of allSafes) {
      if (isMultiChainSafeItem(safe)) {
        if (safe.address.toLowerCase() === address.toLowerCase()) {
          name = safe.name
          safeItem = safe.safes.find((s) => s.chainId === chainId) ?? safe.safes[0]
          break
        }
        const sub = safe.safes.find((s) => s.address.toLowerCase() === address.toLowerCase())
        if (sub) {
          name = sub.name ?? safe.name
          safeItem = sub
          break
        }
      } else {
        if (safe.address.toLowerCase() === address.toLowerCase()) {
          name = safe.name
          safeItem = safe
          break
        }
      }
    }

    accounts.push({ address, name, _safeItem: safeItem })
  }

  return accounts
}

// Falls back to flattening the persisted Space safes when the form is not yet initialised —
// otherwise navigating back from a later step would leave the mockup empty.
export const deriveSelectedBalanceSafes = (
  selectedSafes: Record<string, boolean>,
  allSafes: AllSafeItems,
  fallbackSpaceSafes: AllSafeItems,
): SafeItem[] => {
  const entries = Object.entries(selectedSafes)
  if (entries.length === 0) return flattenSafeItems(fallbackSpaceSafes)

  const result: SafeItem[] = []
  for (const [key, isSelected] of entries) {
    if (!isSelected) continue
    if (key.startsWith(MULTICHAIN_SAFE_KEY_PREFIX)) continue
    const colonIdx = key.indexOf(':')
    if (colonIdx === -1) continue
    const chainId = key.slice(0, colonIdx)
    const address = key.slice(colonIdx + 1)
    let found: SafeItem | undefined
    for (const safe of allSafes) {
      if (isMultiChainSafeItem(safe)) {
        const sub = safe.safes.find((s) => s.chainId === chainId && sameAddress(s.address, address))
        if (sub) {
          found = sub
          break
        }
      } else if (safe.chainId === chainId && sameAddress(safe.address, address)) {
        found = safe
        break
      }
    }
    if (found) result.push(found)
  }
  return result
}

// spaceSafes only carry names the user manually set in the Space address book and are
// usually empty for freshly-added safes — fall back to the user's global trusted + owned safes.
export const deriveNameByAddress = (allSafes: AllSafeItems): Map<string, string> => {
  const map = new Map<string, string>()
  const add = (address: string, name: string | undefined) => {
    if (name && !map.has(address.toLowerCase())) map.set(address.toLowerCase(), name)
  }
  for (const safe of allSafes) {
    if (isMultiChainSafeItem(safe)) {
      add(safe.address, safe.name)
      for (const sub of safe.safes) add(sub.address, sub.name ?? safe.name)
    } else {
      add(safe.address, safe.name)
    }
  }
  return map
}
