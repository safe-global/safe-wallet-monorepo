import { useMemo } from 'react'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import type { SafeInfo } from '@/features/spaces/types'

interface DisplayInfo {
  name: string
  address: string
  threshold: number
  owners: number
  showLiveBalance: boolean
  hasMultipleChains: boolean
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
      const currentSafeInList = safes.find((s) => s.id === currentSafeId)
      const chainCount = currentSafeInList?.chains?.length ?? 1
      return {
        name: currentSafeName,
        address: currentSafeDisplayAddress,
        threshold: safe.threshold,
        owners: safe.owners.length,
        showLiveBalance: true,
        hasMultipleChains: chainCount > 1,
      }
    }

    const chainCount = selectedSafe?.chains?.length ?? 0
    return {
      name: selectedSafe?.name ?? '',
      address: selectedSafe.address,
      threshold: selectedSafe.threshold,
      owners: selectedSafe.owners,
      showLiveBalance: false,
      hasMultipleChains: chainCount > 1,
    }
  }, [
    isCurrentSafeSelected,
    currentSafeName,
    currentSafeDisplayAddress,
    safe.threshold,
    safe.owners.length,
    safes,
    currentSafeId,
    selectedSafe?.name,
    selectedSafe?.address,
    selectedSafe?.threshold,
    selectedSafe?.owners,
    selectedSafe?.chains?.length,
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
