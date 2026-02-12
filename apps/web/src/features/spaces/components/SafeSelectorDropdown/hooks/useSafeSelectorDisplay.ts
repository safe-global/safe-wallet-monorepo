import { useMemo } from 'react'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import type { SafeInfo } from '@/features/spaces/types'

interface DisplayInfo {
  name: string
  address: string
  threshold: number
  owners: number
  showLiveBalance: boolean
}

interface UseSafeSelectorDisplayParams {
  safes: SafeInfo[]
  currentSafeId: string | null
  localSelectedSafeId: string | undefined
  currentSafeName: string
  currentSafeDisplayAddress: string
  safe: ExtendedSafeInfo
}

export const useSafeSelectorDisplay = ({
  safes,
  currentSafeId,
  localSelectedSafeId,
  currentSafeName,
  currentSafeDisplayAddress,
  safe,
}: UseSafeSelectorDisplayParams) => {
  const selectedSafe = safes.find((s) => s.id === localSelectedSafeId) ?? safes[0]
  const isCurrentSafeSelected = currentSafeId != null && (localSelectedSafeId === currentSafeId || safes.length === 0)

  const displayInfo = useMemo((): DisplayInfo => {
    if (isCurrentSafeSelected) {
      return {
        name: currentSafeName,
        address: currentSafeDisplayAddress,
        threshold: safe.threshold,
        owners: safe.owners.length,
        showLiveBalance: true,
      }
    }

    return {
      name: selectedSafe?.name ?? '',
      address: selectedSafe.address,
      threshold: selectedSafe.threshold,
      owners: selectedSafe.owners,
      showLiveBalance: false,
    }
  }, [
    isCurrentSafeSelected,
    currentSafeName,
    currentSafeDisplayAddress,
    safe.threshold,
    safe.owners.length,
    selectedSafe?.name,
    selectedSafe.address,
    selectedSafe.threshold,
    selectedSafe.owners,
  ])

  const selectValue = safes.length > 0 ? localSelectedSafeId : (currentSafeId ?? '')
  const showTrigger = (safes.length > 0 && selectedSafe != null) || (safes.length === 0 && currentSafeId != null)
  const isSingleSafe = safes.length <= 1

  return {
    displayInfo,
    selectValue,
    showTrigger,
    isSingleSafe,
    selectedSafe,
    isCurrentSafeSelected,
  }
}
