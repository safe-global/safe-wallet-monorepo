import type { useSpaceSafes } from '@/features/spaces'
import { isMultiChainSafeItem } from '@/hooks/safes/useAllSafesGrouped'

export type SafeRef = { chainId: string; address: string; name: string }

/** Flatten the grouped space-safes into one entry per (chain, address). */
export const flattenSafes = (safesGrouped: ReturnType<typeof useSpaceSafes>['allSafes']): SafeRef[] => {
  const out: SafeRef[] = []
  for (const item of safesGrouped ?? []) {
    if (isMultiChainSafeItem(item)) {
      for (const s of item.safes) {
        out.push({ chainId: s.chainId, address: s.address, name: item.name || s.name || '' })
      }
    } else {
      out.push({ chainId: item.chainId, address: item.address, name: item.name || '' })
    }
  }
  return out
}

export const safeRefKey = (s: SafeRef) => `${s.chainId}:${s.address.toLowerCase()}`
