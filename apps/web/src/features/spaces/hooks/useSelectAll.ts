import { useCallback, useMemo } from 'react'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { type AllSafeItems } from '@/hooks/safes'
import { SAFE_ACCOUNTS_LIMIT } from '../constants'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../components/SelectSafesOnboarding/constants'
import { collectSafeKeys, collectParentKeys, getSelectionState } from './selectAllHelpers'
import type { AddAccountsFormValues } from './useSelectAll.types'

type Scope = 'all' | 'trusted' | 'owned'

// When the global cap is reached, a section with selections can't grow, so it
// behaves as fully selected: show it checked and let the next click deselect.
// A section with nothing selected can't grow either, so its toggle is disabled
// to avoid dead clicks that look like no-ops.
const applyCap = (selection: ReturnType<typeof getSelectionState>, isAtLimit: boolean) => {
  const disabled = isAtLimit && selection.selectedCount === 0
  return selection.state === 'all' || (isAtLimit && selection.selectedCount > 0)
    ? { ...selection, state: 'all' as const, disabled }
    : { ...selection, disabled }
}

interface Args {
  visibleTrusted: AllSafeItems
  visibleOwned: AllSafeItems
  control: Control<AddAccountsFormValues>
  setValue: UseFormSetValue<AddAccountsFormValues>
}

export function useSelectAll({ visibleTrusted, visibleOwned, control, setValue }: Args) {
  const selectedSafes = useWatch({ control, name: 'selectedSafes' }) ?? {}
  const isAtLimit = useMemo(
    () =>
      Object.entries(selectedSafes).filter(([k, v]) => v && !k.startsWith(MULTICHAIN_SAFE_KEY_PREFIX)).length >=
      SAFE_ACCOUNTS_LIMIT,
    [selectedSafes],
  )

  const trustedSelection = useMemo(
    () => applyCap(getSelectionState(visibleTrusted, selectedSafes), isAtLimit),
    [visibleTrusted, selectedSafes, isAtLimit],
  )
  const ownedSelection = useMemo(
    () => applyCap(getSelectionState(visibleOwned, selectedSafes), isAtLimit),
    [visibleOwned, selectedSafes, isAtLimit],
  )

  const handleSelectAll = useCallback(
    (scope: Scope, check: boolean) => {
      const target =
        scope === 'all' ? [...visibleTrusted, ...visibleOwned] : scope === 'trusted' ? visibleTrusted : visibleOwned
      const safeKeys = collectSafeKeys(target)
      const parentKeys = collectParentKeys(target)

      if (!check) {
        safeKeys.forEach((k) => setValue(`selectedSafes.${k.id}`, false, { shouldValidate: true }))
        parentKeys.forEach((id) => setValue(`selectedSafes.${id}`, false, { shouldValidate: true }))
        return
      }

      const scopeIds = new Set(safeKeys.map((k) => k.id))
      const selectedOutsideScope = Object.entries(selectedSafes).filter(
        ([k, v]) => v && !k.startsWith(MULTICHAIN_SAFE_KEY_PREFIX) && !scopeIds.has(k),
      ).length

      const remaining = Math.max(0, SAFE_ACCOUNTS_LIMIT - selectedOutsideScope)
      const orderedIds = safeKeys.map((k) => k.id)
      const allowed = new Set(orderedIds.slice(0, remaining))

      orderedIds.forEach((id) => setValue(`selectedSafes.${id}`, allowed.has(id), { shouldValidate: true }))

      const parentToSubs = new Map<string, string[]>()
      safeKeys.forEach((k) => {
        if (!k.parentId) return
        const arr = parentToSubs.get(k.parentId) ?? []
        arr.push(k.id)
        parentToSubs.set(k.parentId, arr)
      })
      parentToSubs.forEach((subs, parentId) => {
        const allChecked = subs.every((id) => allowed.has(id))
        setValue(`selectedSafes.${parentId}`, allChecked, { shouldValidate: true })
      })
    },
    [visibleTrusted, visibleOwned, selectedSafes, setValue],
  )

  return { trustedSelection, ownedSelection, handleSelectAll, isAtLimit }
}
