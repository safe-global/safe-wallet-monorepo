import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { MixpanelEventParams } from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { trackSafeProBannerClick, type SafeProBannerLocation } from '../../utils/trackSafeProBannerClick'
import { SafeProBannerView } from '@views/features/safe-pro-announcement/components/SafeProBanner/SafeProBannerView'

const SafeProBanner = ({
  className,
  location = 'workspaces_sign_in',
}: {
  className?: string
  location?: SafeProBannerLocation
}) => {
  const isLive = useIsSafeProEnabled()
  useTrackOnce(SAFE_PRO_EVENTS.SAFE_PRO_BANNER_VIEWED, { [MixpanelEventParams.LOCATION]: location })

  return (
    <SafeProBannerView
      bannerClassName={className}
      isLive={isLive}
      href={SAFE_PRO_ANNOUNCEMENT_URL}
      onClick={() => trackSafeProBannerClick(location)}
    />
  )
}

export default SafeProBanner
