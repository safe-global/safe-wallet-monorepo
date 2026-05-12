import { useCallback, useMemo, useState } from 'react'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { type AllSafeItems } from '@/hooks/safes'
import { SAFE_ACCOUNTS_LIMIT } from '../Sidebar/constants'
import { MULTICHAIN_SAFE_KEY_PREFIX } from '../SelectSafesOnboarding/constants'
import { collectSafeKeys, collectParentKeys, getSelectionState } from './selectAllHelpers'
import type { AddAccountsFormValues } from './types'

type Scope = 'all' | 'trusted' | 'owned'

interface Args {
  visibleTrusted: AllSafeItems
  visibleOwned: AllSafeItems
  control: Control<AddAccountsFormValues>
  setValue: UseFormSetValue<AddAccountsFormValues>
}

export function useSelectAll({ visibleTrusted, visibleOwned, control, setValue }: Args) {
  const selectedSafes = useWatch({ control, name: 'selectedSafes' }) ?? {}
  const trustedSelection = useMemo(
    () => getSelectionState(visibleTrusted, selectedSafes),
    [visibleTrusted, selectedSafes],
  )
  const ownedSelection = useMemo(() => getSelectionState(visibleOwned, selectedSafes), [visibleOwned, selectedSafes])
  const globalSelection = useMemo(
    () => getSelectionState([...visibleTrusted, ...visibleOwned], selectedSafes),
    [visibleTrusted, visibleOwned, selectedSafes],
  )

  const [capReached, setCapReached] = useState(false)

  const handleSelectAll = useCallback(
    (scope: Scope, check: boolean) => {
      setCapReached(false)
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

      if (orderedIds.length > remaining) setCapReached(true)
    },
    [visibleTrusted, visibleOwned, selectedSafes, setValue],
  )

  return { trustedSelection, ownedSelection, globalSelection, handleSelectAll, capReached, setCapReached }
}
