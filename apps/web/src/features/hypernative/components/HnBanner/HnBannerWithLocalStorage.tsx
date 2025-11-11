import useLocalStorage from '@/services/local-storage/useLocalStorage'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import { HnBanner } from './HnBanner'
import { HN_BANNER_LS_KEY } from './constants'

export interface HnBannerWithLocalStorageProps extends WithHnSignupFlowProps {}

/**
 * Wrapper component for HnBanner that doesn't require SafeInfo.
 * Uses localStorage for visibility control and dismissal instead of Redux.
 */
export const HnBannerWithLocalStorage = ({ onHnSignupClick }: HnBannerWithLocalStorageProps) => {
  const [, setBannerVisible] = useLocalStorage<boolean>(HN_BANNER_LS_KEY)

  const handleDismiss = () => {
    setBannerVisible(false)
  }

  return <HnBanner onHnSignupClick={onHnSignupClick} onDismiss={handleDismiss} />
}
