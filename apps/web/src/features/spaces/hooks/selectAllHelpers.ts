import { type AllSafeItems, isMultiChainSafeItem } from '@/hooks/safes'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../components/SelectSafesOnboarding/constants'
import type { AddAccountsFormValues } from './useSelectAll.types'

export type SelectAllState = 'none' | 'some' | 'all'

export type SafeKey = { id: string; parentId?: string }

export function collectSafeKeys(items: AllSafeItems): SafeKey[] {
  const keys: SafeKey[] = []
  items.forEach((item) => {
    if (isMultiChainSafeItem(item)) {
      const parentId = `${MULTICHAIN_SAFE_KEY_PREFIX}${item.address}`
      item.safes.forEach((s) => keys.push({ id: `${s.chainId}:${s.address}`, parentId }))
    } else {
      keys.push({ id: `${item.chainId}:${item.address}` })
    }
  })
  return keys
}

export function collectParentKeys(items: AllSafeItems): string[] {
  return items.filter(isMultiChainSafeItem).map((item) => `${MULTICHAIN_SAFE_KEY_PREFIX}${item.address}`)
}

export function getSelectionState(
  items: AllSafeItems,
  selected: AddAccountsFormValues['selectedSafes'],
): { state: SelectAllState; selectedCount: number; total: number } {
  const keys = collectSafeKeys(items)
  const total = keys.length
  if (total === 0) return { state: 'none', selectedCount: 0, total: 0 }

  const selectedCount = keys.filter((k) => selected[k.id]).length
  if (selectedCount === 0) return { state: 'none', selectedCount, total }
  if (selectedCount === total) return { state: 'all', selectedCount, total }
  return { state: 'some', selectedCount, total }
}
