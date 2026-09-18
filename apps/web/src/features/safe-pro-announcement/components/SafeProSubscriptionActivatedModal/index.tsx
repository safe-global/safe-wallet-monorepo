import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import SafeProHero from '../SafeProHero'
import css from '../SafeProAnnouncement/styles.module.css'

const SafeProSubscriptionActivatedModal = ({
  open,
  onOpenChange,
  planName,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  planName: string
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" surface="card" padding="none">
      <div className="p-1 pb-2">
        <SafeProHero variant="tall" />

        <div className="flex flex-col items-center gap-8 px-8 pt-6 pb-4">
          <Typography variant="h3" align="center" as={DialogTitle}>
            Your paid subscription is active, you&apos;re on <span className={css.highlight}>{planName}</span>!
          </Typography>

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
