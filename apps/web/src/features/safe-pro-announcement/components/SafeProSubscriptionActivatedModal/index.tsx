import { ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import SafeProHero from '../SafeProHero'
import css from '../SafeProAnnouncement/styles.module.css'

const SafeProSubscriptionActivatedModal = ({
  open,
  onOpenChange,
  planName,
  seatsLabel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  planName: string
  /** "5 Safe accounts": the seats the plan covers, shown as a chip under the title when known. */
  seatsLabel?: string
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" surface="card" padding="none">
      <div className="p-1 pb-2">
        <SafeProHero variant="tall" />

        <div className="flex flex-col items-center gap-8 px-8 pt-6 pb-4">
          <div className="flex flex-col items-center gap-3">
            <Typography variant="h3" align="center" as={DialogTitle}>
              Your paid subscription is active, you&apos;re on <span className={css.highlight}>{planName}</span>!
            </Typography>
            {seatsLabel && (
              <Badge variant="secondary" shape="tag" data-testid="subscription-seats">
                {planName} · {seatsLabel}
              </Badge>
            )}
          </div>

          <Button size="lg" accentIcon className="w-full" onClick={() => onOpenChange(false)}>
            Get started
            <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProSubscriptionActivatedModal
