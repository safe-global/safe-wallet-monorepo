import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import SafeProHero from '../SafeProHero'
import css from '../SafeProAnnouncement/styles.module.css'

const formatPrice = (price: number, currency: string) =>
  new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

const SafeProSubscriptionActivatedModal = ({
  open,
  onOpenChange,
  planName,
  price,
  currency,
  billingCycle,
  nextBillingAt,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  planName: string
  price: number
  currency: string
  billingCycle: 'month' | 'year'
  nextBillingAt: number
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" surface="card" padding="none">
      <div className="p-1 pb-2">
        <SafeProHero variant="tall" />

        <div className="flex flex-col items-center gap-8 px-8 pt-6 pb-4">
          <div className="flex flex-col gap-2">
            <Typography variant="h3" align="center" as={DialogTitle}>
              Your Workspace is now on <span className={css.highlight}>Safe Pro</span>
            </Typography>
            <Typography color="muted" align="center">
              {planName} plan, {formatPrice(price, currency)} per {billingCycle}. Your next payment is on{' '}
              {formatDate(nextBillingAt)}.
            </Typography>
          </div>

          <Button size="lg" className="w-full" onClick={() => onOpenChange(false)}>
            Go to Workspace
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProSubscriptionActivatedModal
