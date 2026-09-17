import NextLink from 'next/link'
import type { LinkProps } from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import SafeProHero from '../SafeProHero'

const SafeProTrialActivatedModal = ({
  open,
  onOpenChange,
  trialEndsAt,
  ctaHref,
  ctaLabel = 'Get started',
  onAddBillingDetails,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trialEndsAt: number
  /** Where the CTA leads; without it the CTA just closes. */
  ctaHref?: LinkProps['href']
  ctaLabel?: string
  /** Offers the Stripe portal right away; without it the secondary link is omitted. */
  onAddBillingDetails?: () => void
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" surface="card" padding="none">
      <div className="p-1 pb-2">
        <SafeProHero variant="tall" />

        <div className="flex flex-col items-center gap-8 px-8 pt-6 pb-4">
          <div className="flex flex-col gap-2">
            <Typography variant="h3" align="center" as={DialogTitle}>
              Your free trial is active until {formatDate(trialEndsAt)}
            </Typography>
            <Typography color="muted" align="center">
              All Pro features are unlocked for your Workspace. We&apos;ll remind you to add billing details before the
              trial ends. Nothing is charged until you do.
            </Typography>
          </div>

          <div className="flex w-full flex-col items-center gap-3">
            <Button
              size="lg"
              accentIcon
              className="w-full"
              render={ctaHref ? <NextLink href={ctaHref} /> : undefined}
              onClick={() => onOpenChange(false)}
            >
              {ctaLabel}
              <ArrowRight data-icon="inline-end" />
            </Button>
            {onAddBillingDetails && (
              <Button variant="ghost-muted" size="sm" onClick={onAddBillingDetails}>
                Add payment method now
              </Button>
            )}
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)

export default SafeProTrialActivatedModal
