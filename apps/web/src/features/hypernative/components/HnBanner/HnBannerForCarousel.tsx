import type { ComponentType } from 'react'
import type { NewsBannerProps } from '@/components/dashboard/NewsCarousel'
import HnBannerDefault from './index'

/**
 * HnBanner wrapper for use in the dashboard NewsCarousel.
 * Ignores props passed by the carousel and renders the default export of HnBanner.
 * The default export includes withHnFeature and withHnSignupFlow HOCs.
 */
export const HnBannerForCarousel: ComponentType<NewsBannerProps> = () => {
  return <HnBannerDefault isDismissable={true} />
}
