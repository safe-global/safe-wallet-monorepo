import { Card, CardContent } from '@safe-global/views/components/ui/card'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import { formatPrice, TRIAL_DAYS, type TrialSize } from './plans'

const DAY_MS = 24 * 60 * 60 * 1000

/** Stand-in for Stripe Checkout, so the hand-off shows which plan was sent and that the user can come back. */
const MockStripeCheckout = ({ size, onBack }: { size: TrialSize; onBack: () => void }) => (
  <div className="flex min-h-screen items-center justify-center bg-muted p-6" data-testid="mock-stripe-checkout">
    <Card className="w-full max-w-md">
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button type="button" className="text-sm text-muted-foreground hover:underline" onClick={onBack}>
              ← Back to Safe
            </button>
            <Typography variant="paragraph-mini" color="muted">
              Stripe Checkout (mocked)
            </Typography>
          </div>
          <div className="flex flex-col gap-1">
            <Typography variant="paragraph-small" color="muted">
              Try Safe Pro {size.plan} ({size.seats} Safes)
            </Typography>
            <Typography variant="h3">{TRIAL_DAYS} days free</Typography>
            <Typography variant="paragraph-small" color="muted">
              Then {formatPrice(size.monthlyPrice)} per month starting {formatDate(Date.now() + TRIAL_DAYS * DAY_MS)}
            </Typography>
          </div>
          <Separator />
          <div className="flex justify-between">
            <Typography variant="paragraph-small">Total due today</Typography>
            <Typography variant="paragraph-small-bold">{formatPrice(0)}</Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

export default MockStripeCheckout
