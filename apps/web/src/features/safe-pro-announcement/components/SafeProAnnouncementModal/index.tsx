import SafeProAnnouncement from '../SafeProAnnouncement'
import { SafeProAnnouncementModalView } from '@views/features/safe-pro-announcement/components/SafeProAnnouncementModal/SafeProAnnouncementModalView'

const LOCATION = 'announcement_modal'

const SafeProAnnouncementModal = ({
  open,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => (
  <SafeProAnnouncementModalView
    open={open}
    onOpenChange={onOpenChange}
    announcement={<SafeProAnnouncement location={LOCATION} onDismiss={() => onOpenChange?.(false)} />}
  />
)

export default SafeProAnnouncementModal
