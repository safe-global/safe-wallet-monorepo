import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import SafeProHero from '../SafeProHero'
import css from '../SafeProAnnouncement/styles.module.css'

const SafeProBillingReminderModal = ({
  open,
  onOpenChange,
  trialEndsAt,
  onAddBillingDetails,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trialEndsAt: number
  onAddBillingDetails: () => void
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" surface="card" padding="none">
      <div className="p-1 pb-2">
        <SafeProHero variant="tall" />

        <div className="flex flex-col gap-8 px-7 pt-6 pb-4">
          <div className="flex flex-col gap-2">
            <Typography variant="h3" align="center" as={DialogTitle}>
              Add billing details to continue with <span className={css.highlight}>Safe Pro</span>
            </Typography>
            <Typography color="muted" align="center">
              If you don&apos;t add billing details by {formatDate(trialEndsAt)}, your Workspace will be locked. Your
              Safe accounts remain available outside the Workspace.
            </Typography>
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" size="lg" className="flex-1" onClick={() => onOpenChange(false)}>
              Not now
            </Button>
            <Button size="lg" className="flex-1" onClick={onAddBillingDetails}>
              Add billing details
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProBillingReminderModal
