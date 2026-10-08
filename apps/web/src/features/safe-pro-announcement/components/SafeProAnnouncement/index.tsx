import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { MixpanelEventParams } from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { trackSafeProBannerClick, type SafeProBannerLocation } from '../../utils/trackSafeProBannerClick'
import { SafeProAnnouncementView } from '@views/features/safe-pro-announcement/components/SafeProAnnouncement/SafeProAnnouncementView'

const SafeProAnnouncement = ({ location, onDismiss }: { location: SafeProBannerLocation; onDismiss?: () => void }) => {
  useTrackOnce(SAFE_PRO_EVENTS.SAFE_PRO_BANNER_VIEWED, { [MixpanelEventParams.LOCATION]: location })

  return (
    <SafeProAnnouncementView
      learnMoreHref={SAFE_PRO_ANNOUNCEMENT_URL}
      onLearnMoreClick={() => trackSafeProBannerClick(location)}
      onDismiss={onDismiss}
    />
  )
}

export default SafeProAnnouncement
