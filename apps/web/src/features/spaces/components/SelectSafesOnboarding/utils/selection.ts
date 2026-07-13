import type { UseFormSetValue } from 'react-hook-form'
import { isMultiChainSafeItem, type AllSafeItems, type MultiChainSafeItem } from '@/hooks/safes'
import type { AccountLine } from '@/features/myAccounts'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../constants'
import { getSafeId, getMultiChainSafeId } from './safeIds'
import type { AddAccountsFormValues } from '../../../hooks/addAccounts.types'

/**
 * Leaf keys currently selected (single safes + per-chain children). The multi-chain parent keys are a
 * UI grouping only and never sent to the backend, so they're filtered out.
 */
export const getSelectedLeafKeys = (selectedSafes: Record<string, boolean>): Set<string> =>
  new Set(
    Object.entries(selectedSafes)
      .filter(([key, value]) => value && !key.startsWith(MULTICHAIN_SAFE_KEY_PREFIX))
      .map(([key]) => key),
  )

/**
 * Applies a checkbox toggle to the onboarding form's `selectedSafes` record, reconciling multi-chain
 * parent keys with their children: toggling a group cascades to every child, and toggling a single
 * child re-derives its parent's aggregate (checked only when all siblings are checked).
 *
 * Shared by the onboarding selection hook and the workspace "Add accounts" picker so the two stay in
 * lockstep.
 */
export const applySafeSelectionToggle = (
  setValue: UseFormSetValue<AddAccountsFormValues>,
  items: AllSafeItems,
  selectedSafes: Record<string, boolean>,
  line: AccountLine,
  nextChecked: boolean,
): void => {
  if (line.variant === 'group') {
    const group = line.source as MultiChainSafeItem
    setValue(`selectedSafes.${getMultiChainSafeId(group)}`, nextChecked, { shouldValidate: true })
    group.safes.forEach((safe) => setValue(`selectedSafes.${getSafeId(safe)}`, nextChecked, { shouldValidate: true }))
    return
  }

  setValue(`selectedSafes.${line.key}`, nextChecked, { shouldValidate: true })

  // Reconcile the multi-chain parent key when a child leaf is toggled individually.
  const parent = items.find(
    (item): item is MultiChainSafeItem =>
      isMultiChainSafeItem(item) && item.safes.some((safe) => getSafeId(safe) === line.key),
  )
  if (parent) {
    const allChecked = parent.safes.every((safe) => {
      const key = getSafeId(safe)
      return key === line.key ? nextChecked : Boolean(selectedSafes[key])
    })
    setValue(`selectedSafes.${getMultiChainSafeId(parent)}`, allChecked, { shouldValidate: true })
  }
}
