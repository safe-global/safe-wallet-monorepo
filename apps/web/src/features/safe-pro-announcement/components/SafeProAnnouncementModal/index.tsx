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
    <DialogContent className="max-w-[1200px] bg-card p-0">
      <DialogTitle className="sr-only" render={<div />}>
        Your Workspace moves to Pro on Oct 6, 2026
      </DialogTitle>
      <SafeProAnnouncement onDismiss={() => onOpenChange?.(false)} />
    </DialogContent>
  </Dialog>
)

export default SafeProAnnouncementModal
