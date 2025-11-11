import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import { HnBanner } from './HnBanner'

export interface HnBannerWithLocalStorageProps extends WithHnSignupFlowProps { }

/**
 * Wrapper component for HnBanner that doesn't require SafeInfo.
 * Uses localStorage for visibility control instead of Redux.
 */
export const HnBannerWithLocalStorage = ({ onHnSignupClick }: HnBannerWithLocalStorageProps) => {
  // No dismissal functionality, just render the banner
  return <HnBanner onHnSignupClick={onHnSignupClick} />
}

