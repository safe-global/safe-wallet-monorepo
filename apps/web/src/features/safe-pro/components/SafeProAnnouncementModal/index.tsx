import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import SafeProAnnouncement, { type AnnouncementWrapper } from '../SafeProAnnouncement'

const DialogTitleWrapper: AnnouncementWrapper = ({ children }) => <DialogTitle render={<div />}>{children}</DialogTitle>

const DialogDescriptionWrapper: AnnouncementWrapper = ({ children }) => (
  <DialogDescription render={<div />}>{children}</DialogDescription>
)

const SafeProAnnouncementModal = ({
  open,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="md" surface="card" padding="none">
      <SafeProAnnouncement TitleWrapper={DialogTitleWrapper} DescriptionWrapper={DialogDescriptionWrapper} />
    </DialogContent>
  </Dialog>
)

export default SafeProAnnouncementModal
