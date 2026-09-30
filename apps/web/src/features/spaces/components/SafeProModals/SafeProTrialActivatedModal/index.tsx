import NextLink from 'next/link'
import type { LinkProps } from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DialogTitle } from '@/components/ui/dialog'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import SafeProModalFrame from '../SafeProModalFrame'

const SafeProTrialActivatedModal = ({
  open,
  onOpenChange,
  trialEndsAt,
  ctaHref,
  ctaLabel = 'Get started',
  hasPaymentMethod = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Null when neither the subscription nor the plan knows its period end yet. */
  trialEndsAt: number | null
  /** Where the CTA leads; without it the CTA just closes. */
  ctaHref?: LinkProps['href']
  ctaLabel?: string
  /** Checkout already took a payment method, so the subscription starts on its own. */
  hasPaymentMethod?: boolean
}) => (
  <SafeProModalFrame open={open} onOpenChange={onOpenChange}>
    <div className="flex flex-col gap-3">
      <Typography variant="h4" as={DialogTitle}>
        Your free access is active{trialEndsAt !== null ? ` until ${formatDate(trialEndsAt)}` : ''}
      </Typography>
      <Typography variant="paragraph-small" color="muted">
        {hasPaymentMethod
          ? 'All Pro features are unlocked for your Workspace. Your subscription starts on its own when your free access ends — nothing is charged before.'
          : 'All Pro features are unlocked for your Workspace. We’ll remind you to add a payment method before your free access ends — nothing is charged until you do.'}
      </Typography>
    </div>

    <div className="flex flex-col items-center gap-3">
      <Button
        accentIcon
        className="min-w-64"
        render={ctaHref ? <NextLink href={ctaHref} /> : undefined}
        onClick={() => onOpenChange(false)}
      >
        {ctaLabel}
        <ArrowRight data-icon="inline-end" />
      </Button>
    </div>
  </SafeProModalFrame>
)

export default SafeProTrialActivatedModal
