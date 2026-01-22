import { useCallback, useState } from 'react'
import useHiddenNestedSafes from '@/hooks/useHiddenNestedSafes'
import useUserUnhiddenNestedSafes from '@/hooks/useUserUnhiddenNestedSafes'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch } from '@/store'
import { setHiddenNestedSafes, setUserUnhiddenNestedSafes } from '@/store/settingsSlice'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'

/**
 * Manages the toggle/save/cancel logic for nested safes in manage mode.
 * Handles three types of hiding:
 * 1. Manual hide: User explicitly hides a valid safe
 * 2. Auto-hide: Invalid safes are hidden by default
 * 3. User unhide: User explicitly unhides an auto-hidden safe
 */
export const useManageNestedSafes = (allSafesWithStatus: NestedSafeWithStatus[]) => {
  const dispatch = useAppDispatch()
  const safeAddress = useSafeAddress()
  const manuallyHiddenSafes = useHiddenNestedSafes()
  const userUnhiddenSafes = useUserUnhiddenNestedSafes()

  // Track pending changes for manual hiding
  const [safesToManuallyHide, setSafesToManuallyHide] = useState<string[]>([])
  const [safesToManuallyUnhide, setSafesToManuallyUnhide] = useState<string[]>([])

  // Track pending changes for user unhide overrides
  const [safesToUserUnhide, setSafesToUserUnhide] = useState<string[]>([])
  const [safesToReAutoHide, setSafesToReAutoHide] = useState<string[]>([])

  const toggleSafe = useCallback(
    (address: string) => {
      const safeStatus = allSafesWithStatus.find((s) => s.address === address)
      if (!safeStatus) return

      // Case 1: Safe is valid - toggle manual hide
      if (safeStatus.isValid) {
        // Check if we're undoing a pending action
        if (safesToManuallyHide.includes(address)) {
          setSafesToManuallyHide((prev) => prev.filter((s) => s !== address))
          return
        }
        if (safesToManuallyUnhide.includes(address)) {
          setSafesToManuallyUnhide((prev) => prev.filter((s) => s !== address))
          return
        }

        // Toggle based on current state
        if (manuallyHiddenSafes.includes(address)) {
          setSafesToManuallyUnhide((prev) => [...prev, address])
        } else {
          setSafesToManuallyHide((prev) => [...prev, address])
        }
        return
      }

      // Case 2: Safe is invalid - toggle user unhide
      // Check if we're undoing a pending action
      if (safesToUserUnhide.includes(address)) {
        setSafesToUserUnhide((prev) => prev.filter((s) => s !== address))
        return
      }
      if (safesToReAutoHide.includes(address)) {
        setSafesToReAutoHide((prev) => prev.filter((s) => s !== address))
        return
      }

      // Toggle based on current state
      if (userUnhiddenSafes.includes(address)) {
        // User wants to re-hide this auto-hidden safe
        setSafesToReAutoHide((prev) => [...prev, address])
      } else {
        // User wants to unhide this auto-hidden safe
        setSafesToUserUnhide((prev) => [...prev, address])
      }
    },
    [
      allSafesWithStatus,
      safesToManuallyHide,
      safesToManuallyUnhide,
      safesToUserUnhide,
      safesToReAutoHide,
      manuallyHiddenSafes,
      userUnhiddenSafes,
    ],
  )

  const isSafeSelected = useCallback(
    (address: string) => {
      const safeStatus = allSafesWithStatus.find((s) => s.address === address)
      if (!safeStatus) return false

      // For valid safes: selected = manually hidden
      if (safeStatus.isValid) {
        const isCurrentlyHidden = manuallyHiddenSafes.includes(address)
        if (safesToManuallyHide.includes(address)) return true
        if (safesToManuallyUnhide.includes(address)) return false
        return isCurrentlyHidden
      }

      // For invalid safes: selected = auto-hidden (not user-unhidden)
      const isCurrentlyUserUnhidden = userUnhiddenSafes.includes(address)
      if (safesToUserUnhide.includes(address)) return false // Will be unhidden
      if (safesToReAutoHide.includes(address)) return true // Will be re-hidden
      return !isCurrentlyUserUnhidden // Auto-hidden unless user unhid
    },
    [
      allSafesWithStatus,
      manuallyHiddenSafes,
      userUnhiddenSafes,
      safesToManuallyHide,
      safesToManuallyUnhide,
      safesToUserUnhide,
      safesToReAutoHide,
    ],
  )

  const cancel = useCallback(() => {
    setSafesToManuallyHide([])
    setSafesToManuallyUnhide([])
    setSafesToUserUnhide([])
    setSafesToReAutoHide([])
  }, [])

  const saveChanges = useCallback(() => {
    // Update manually hidden safes
    const newManuallyHidden = [
      ...manuallyHiddenSafes.filter((safe) => !safesToManuallyUnhide.includes(safe)),
      ...safesToManuallyHide,
    ]
    dispatch(setHiddenNestedSafes({ safeAddress, nestedSafes: newManuallyHidden }))

    // Update user unhidden safes
    const newUserUnhidden = [
      ...userUnhiddenSafes.filter((safe) => !safesToReAutoHide.includes(safe)),
      ...safesToUserUnhide,
    ]
    dispatch(setUserUnhiddenNestedSafes({ safeAddress, nestedSafes: newUserUnhidden }))

    // Reset pending changes
    setSafesToManuallyHide([])
    setSafesToManuallyUnhide([])
    setSafesToUserUnhide([])
    setSafesToReAutoHide([])
  }, [
    safesToManuallyHide,
    safesToManuallyUnhide,
    safesToUserUnhide,
    safesToReAutoHide,
    safeAddress,
    dispatch,
    manuallyHiddenSafes,
    userUnhiddenSafes,
  ])

  // Count of safes that will be hidden after save
  const selectedCount = allSafesWithStatus.filter((safe) => isSafeSelected(safe.address)).length

  return {
    toggleSafe,
    isSafeSelected,
    saveChanges,
    cancel,
    selectedCount,
  }
}
