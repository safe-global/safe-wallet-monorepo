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
    <DialogContent size="md" surface="card" padding="none">
      <DialogTitle className="sr-only" render={<div />}>
        Your Workspace moves to Pro on Oct 1, 2026
      </DialogTitle>
      <SafeProAnnouncement />
    </DialogContent>
  </Dialog>
)

export default SafeProAnnouncementModal
