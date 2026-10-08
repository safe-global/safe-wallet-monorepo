import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { MixpanelEventParams } from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { trackSafeProBannerClick } from '../../utils/trackSafeProBannerClick'
import { SafeProSidebarBannerView } from '@views/features/safe-pro-announcement/components/SafeProSidebarBanner/SafeProSidebarBannerView'

const SafeProSidebarBanner = ({
  className,
  onDismiss,
  isShown = true,
}: {
  className?: string
  onDismiss?: () => void
  /** The footer keeps the banner mounted but invisible while another card holds its slot. */
  isShown?: boolean
}) => {
  useTrackOnce(SAFE_PRO_EVENTS.SAFE_PRO_BANNER_VIEWED, { [MixpanelEventParams.LOCATION]: 'sidebar' }, isShown)

  return (
    <SafeProSidebarBannerView
      bannerClassName={className}
      learnMoreHref={SAFE_PRO_ANNOUNCEMENT_URL}
      onLearnMoreClick={() => trackSafeProBannerClick('sidebar')}
      onDismiss={onDismiss}
    />
  )
}

export default SafeProSidebarBanner
