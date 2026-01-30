import { useCallback, useState } from 'react'
import useManuallyHiddenSafes from '@/hooks/useManuallyHiddenSafes'
import useOverriddenAutoHideSafes from '@/hooks/useOverriddenAutoHideSafes'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch } from '@/store'
import { setManuallyHiddenSafes, setOverriddenAutoHideSafes } from '@/store/settingsSlice'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import { sameAddress } from '@safe-global/utils/utils/addresses'

type PendingAction = 'hide' | 'show'

const addIfMissing = (arr: string[], value: string): string[] =>
  arr.some((item) => sameAddress(item, value)) ? arr : [...arr, value]

const removeFromArray = (arr: string[], value: string): string[] => arr.filter((a) => !sameAddress(a, value))

const applyValidSafeAction = (action: PendingAction, address: string, arr: string[]): string[] =>
  action === 'hide' ? addIfMissing(arr, address) : removeFromArray(arr, address)

const applyInvalidSafeAction = (action: PendingAction, address: string, arr: string[]): string[] =>
  action === 'show' ? addIfMissing(arr, address) : removeFromArray(arr, address)

/**
 * Manages the toggle/save/cancel logic for nested safes in manage mode.
 * Uses a single map to track pending changes instead of multiple arrays.
 */
export const useManageNestedSafes = (allSafesWithStatus: NestedSafeWithStatus[]) => {
  const dispatch = useAppDispatch()
  const safeAddress = useSafeAddress()
  const manuallyHiddenSafes = useManuallyHiddenSafes()
  const overriddenAutoHideSafes = useOverriddenAutoHideSafes()

  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingAction>>(new Map())

  // Determine if a safe is currently hidden (before pending changes)
  const isSafeCurrentlyHidden = useCallback(
    (address: string): boolean => {
      const safeStatus = allSafesWithStatus.find((s) => s.address === address)
      if (!safeStatus) return false

      if (safeStatus.isValid) {
        return manuallyHiddenSafes.some((hidden) => sameAddress(hidden, address))
      }
      // Invalid safes are hidden unless user overrode
      return !overriddenAutoHideSafes.some((overridden) => sameAddress(overridden, address))
    },
    [allSafesWithStatus, manuallyHiddenSafes, overriddenAutoHideSafes],
  )

  const toggleSafe = useCallback(
    (address: string) => {
      setPendingChanges((prev) => {
        const next = new Map(prev)
        if (next.has(address)) {
          next.delete(address)
        } else {
          const action: PendingAction = isSafeCurrentlyHidden(address) ? 'show' : 'hide'
          next.set(address, action)
        }
        return next
      })
    },
    [isSafeCurrentlyHidden],
  )

  // Determine if a safe will be hidden after applying pending changes
  const isSafeSelected = useCallback(
    (address: string): boolean => {
      const pendingAction = pendingChanges.get(address)
      if (pendingAction === 'hide') return true
      if (pendingAction === 'show') return false
      return isSafeCurrentlyHidden(address)
    },
    [pendingChanges, isSafeCurrentlyHidden],
  )

  const cancel = useCallback(() => {
    setPendingChanges(new Map())
  }, [])

  const saveChanges = useCallback(() => {
    let newManuallyHidden = [...manuallyHiddenSafes]
    let newOverridden = [...overriddenAutoHideSafes]

    pendingChanges.forEach((action, address) => {
      const safeStatus = allSafesWithStatus.find((s) => s.address === address)
      if (!safeStatus) return

      if (safeStatus.isValid) {
        newManuallyHidden = applyValidSafeAction(action, address, newManuallyHidden)
      } else {
        newOverridden = applyInvalidSafeAction(action, address, newOverridden)
      }
    })

    dispatch(setManuallyHiddenSafes({ safeAddress, nestedSafes: newManuallyHidden }))
    dispatch(setOverriddenAutoHideSafes({ safeAddress, nestedSafes: newOverridden }))
    setPendingChanges(new Map())
  }, [pendingChanges, allSafesWithStatus, manuallyHiddenSafes, overriddenAutoHideSafes, safeAddress, dispatch])

  const selectedCount = allSafesWithStatus.filter((safe) => isSafeSelected(safe.address)).length

  return {
    toggleSafe,
    isSafeSelected,
    saveChanges,
    cancel,
    selectedCount,
  }
}
