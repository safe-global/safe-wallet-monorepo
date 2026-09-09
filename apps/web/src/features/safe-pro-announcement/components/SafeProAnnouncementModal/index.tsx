import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import SafeProAnnouncement from '../SafeProAnnouncement'

const SafeProAnnouncementModal = ({
  open,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
      size="md"
      surface="card"
      padding="none"
      // eslint-disable-next-line no-restricted-syntax -- Figma spec calls for a 32px corner one-off; no radius token in the scale matches it
      className="rounded-[2rem]"
    >
      <DialogTitle className="sr-only" render={<div />}>
        Your Workspace moves to Pro on Oct 6, 2026
      </DialogTitle>
      <SafeProAnnouncement location="announcement_modal" onDismiss={() => onOpenChange?.(false)} />
    </DialogContent>
  </Dialog>
)

export default SafeProAnnouncementModal
