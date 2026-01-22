import { useCallback, useState } from 'react'
import useHiddenNestedSafes from '@/hooks/useHiddenNestedSafes'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useAppDispatch } from '@/store'
import { setHiddenNestedSafes } from '@/store/settingsSlice'

export const useManageNestedSafes = (allNestedSafes: string[]) => {
  const dispatch = useAppDispatch()
  const safeAddress = useSafeAddress()
  const hiddenSafes = useHiddenNestedSafes()

  const [safesToHide, setSafesToHide] = useState<string[]>([])
  const [safesToUnhide, setSafesToUnhide] = useState<string[]>([])

  const toggleSafe = useCallback(
    (address: string) => {
      if (safesToHide.includes(address)) {
        setSafesToHide(safesToHide.filter((safe) => safe !== address))
        return
      }

      if (safesToUnhide.includes(address)) {
        setSafesToUnhide(safesToUnhide.filter((safe) => safe !== address))
        return
      }

      const isHidden = hiddenSafes.includes(address)
      if (!isHidden) {
        setSafesToHide([...safesToHide, address])
      } else {
        setSafesToUnhide([...safesToUnhide, address])
      }
    },
    [safesToHide, safesToUnhide, hiddenSafes],
  )

  const isSafeSelected = useCallback(
    (address: string) =>
      (hiddenSafes.includes(address) && !safesToUnhide.includes(address)) || safesToHide.includes(address),
    [safesToHide, safesToUnhide, hiddenSafes],
  )

  const cancel = useCallback(() => {
    setSafesToHide([])
    setSafesToUnhide([])
  }, [])

  const saveChanges = useCallback(() => {
    const newHiddenSafes = [...hiddenSafes.filter((safe) => !safesToUnhide.includes(safe)), ...safesToHide]
    dispatch(setHiddenNestedSafes({ safeAddress, nestedSafes: newHiddenSafes }))
    setSafesToHide([])
    setSafesToUnhide([])
  }, [safesToHide, safesToUnhide, safeAddress, dispatch, hiddenSafes])

  const selectedCount =
    hiddenSafes.filter((safe) => !safesToUnhide.includes(safe) && allNestedSafes.includes(safe)).length +
    safesToHide.length

  return {
    toggleSafe,
    isSafeSelected,
    saveChanges,
    cancel,
    selectedCount,
  }
}
