import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import SafeProHero from '../SafeProHero'
import css from '../SafeProAnnouncement/styles.module.css'

/** Confirms a plan switched during the free access: nothing changes until the trial ends, then the new price applies. */
const SafeProPlanSwitchedModal = ({
  open,
  onOpenChange,
  planName,
  trialEndsAt,
  price,
  seatsLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  planName: string
  trialEndsAt: number | null
  /** Already formatted, e.g. "€189/mo". */
  price: string
  /** "5 Safe accounts": the seats the plan covers, shown as a chip under the title when known. */
  seatsLabel?: string
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" surface="card" padding="none">
      <div className="p-1 pb-2">
        <SafeProHero variant="tall" />

        <div className="flex flex-col items-center gap-6 px-8 pt-6 pb-4">
          <div className="flex flex-col gap-2">
            <Typography variant="h3" align="center" as={DialogTitle}>
              You&apos;re on <span className={css.highlight}>{planName}</span>!
            </Typography>
            <Typography color="muted" align="center">
              Your free access continues{trialEndsAt !== null ? ` until ${formatDate(trialEndsAt)}` : ''}. After that,
              you&apos;ll pay {price}.
            </Typography>
            {seatsLabel && (
              <Badge variant="secondary" shape="tag" className="self-center" data-testid="subscription-seats">
                {planName} · {seatsLabel}
              </Badge>
            )}
          </div>

          <Button size="lg" accentIcon onClick={() => onOpenChange(false)}>
            Get started
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProPlanSwitchedModal
