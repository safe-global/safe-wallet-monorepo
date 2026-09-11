import { useCallback } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useIsSwapFeatureEnabled } from '@/features/swap'

export const SWAPS_APP_CARD_STORAGE_KEY = 'showSwapsAppCard'

/** Visibility and dismissal for the native swaps promo card. */
export const useNativeSwapsCard = () => {
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const [isCardVisible = true, setIsCardVisible] = useLocalStorage<boolean>(SWAPS_APP_CARD_STORAGE_KEY)

  const dismiss = useCallback(() => setIsCardVisible(false), [setIsCardVisible])

  return {
    isVisible: isSwapFeatureEnabled && isCardVisible,
    dismiss,
  }
}
