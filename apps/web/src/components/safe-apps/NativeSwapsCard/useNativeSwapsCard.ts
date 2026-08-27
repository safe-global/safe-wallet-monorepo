import { useCallback } from 'react'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useIsSwapFeatureEnabled } from '@/features/swap'

export const SWAPS_APP_CARD_STORAGE_KEY = 'showSwapsAppCard'

/**
 * Owns the promo card's visibility so a parent can skip its grid cell entirely
 * instead of laying out an empty one around a card that renders `null`.
 */
export const useNativeSwapsCard = () => {
  const isSwapFeatureEnabled = useIsSwapFeatureEnabled()
  const [isCardVisible = true, setIsCardVisible] = useLocalStorage<boolean>(SWAPS_APP_CARD_STORAGE_KEY)

  const dismiss = useCallback(() => setIsCardVisible(false), [setIsCardVisible])

  return {
    isVisible: isSwapFeatureEnabled && isCardVisible,
    dismiss,
  }
}
