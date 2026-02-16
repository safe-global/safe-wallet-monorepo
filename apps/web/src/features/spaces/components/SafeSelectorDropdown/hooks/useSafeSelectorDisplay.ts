import { useMemo } from 'react'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import type { SafeInfo } from '@/features/spaces/types'

export interface DisplayInfo {
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

const getDisplayInfo = (
  isCurrentSafeSelected: boolean,
  currentSafeName: string,
  currentSafeDisplayAddress: string,
  safe: ExtendedSafeInfo,
  selectedSafe: SafeInfo | undefined,
  safes: SafeInfo[],
  currentSafeId: string | null,
): DisplayInfo => {
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
    address: selectedSafe?.address ?? '',
    threshold: selectedSafe?.threshold ?? 0,
    owners: selectedSafe?.owners ?? 0,
    showLiveBalance: false,
    hasMultipleChains: chainCount > 1,
  }
}

export const useSafeSelectorDisplay = ({
  safes,
  currentSafeId,
  localSelectedSafeId,
  currentSafeName,
  currentSafeDisplayAddress,
  safe,
}: UseSafeSelectorDisplayParams) => {
  const selectedSafe = useMemo(
    () => safes.find((s) => s.id === localSelectedSafeId) ?? safes[0],
    [safes, localSelectedSafeId],
  )
  const isCurrentSafeSelected = currentSafeId != null && (localSelectedSafeId === currentSafeId || safes.length === 0)

  const displayInfo = useMemo(
    () =>
      getDisplayInfo(
        isCurrentSafeSelected,
        currentSafeName,
        currentSafeDisplayAddress,
        safe,
        selectedSafe,
        safes,
        currentSafeId,
      ),
    [isCurrentSafeSelected, currentSafeName, currentSafeDisplayAddress, safe, selectedSafe, safes, currentSafeId],
  )

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
