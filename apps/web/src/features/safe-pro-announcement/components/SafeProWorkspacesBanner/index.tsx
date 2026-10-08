import { useDarkMode } from '@/hooks/useDarkMode'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { MixpanelEventParams } from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { trackSafeProBannerClick, type SafeProBannerLocation } from '../../utils/trackSafeProBannerClick'
import { SafeProWorkspacesBannerView } from '@views/features/safe-pro-announcement/components/SafeProWorkspacesBanner/SafeProWorkspacesBannerView'

const SafeProWorkspacesBanner = ({
  className,
  location = 'workspaces_list',
}: {
  className?: string
  location?: SafeProBannerLocation
}) => {
  const isDarkMode = useDarkMode()
  const isLive = useIsSafeProEnabled()
  useTrackOnce(SAFE_PRO_EVENTS.SAFE_PRO_BANNER_VIEWED, { [MixpanelEventParams.LOCATION]: location })

  return (
    <SafeProWorkspacesBannerView
      bannerClassName={className}
      isDarkMode={isDarkMode}
      isLive={isLive}
      learnMoreHref={SAFE_PRO_ANNOUNCEMENT_URL}
      onLearnMoreClick={() => trackSafeProBannerClick(location)}
    />
  )
}

export default SafeProWorkspacesBanner
