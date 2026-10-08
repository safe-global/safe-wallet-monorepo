import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

export type SeatLimitBannerViewProps = {
  /** `card` sits on the Safe accounts page, `alert` inside the add-accounts chooser. */
  variant: 'card' | 'alert'
  bannerClassName?: string
  tierName?: string | null
  limit: number
  upgradePlanName?: string
  plansHref: string
  salesUrl: string
  onUpgradeClick: () => void
  isDismissed: boolean
  onDismiss: () => void
}

/** Shown once the Workspace holds as many Safes as its plan covers: upgrade when a bigger plan is offered, else sales. */
export const SeatLimitBannerView = ({
  variant,
  bannerClassName,
  tierName,
  limit,
  upgradePlanName,
  plansHref,
  salesUrl,
  onUpgradeClick,
  isDismissed,
  onDismiss,
}: SeatLimitBannerViewProps): ReactElement | null => {
  const title = `${tierName ? `The ${tierName} plan` : 'Your plan'} includes ${limit} Safe accounts`
  const body = upgradePlanName
    ? 'Upgrade for more, or remove one to add another.'
    : 'Remove one to add another, or talk to us about a higher limit.'
  const cta = (
    <Button
      size="sm"
      accentIcon
      className="shrink-0"
      render={
        upgradePlanName ? (
          <NextLink href={plansHref} />
        ) : (
          <a href={salesUrl} target="_blank" rel="noopener noreferrer" />
        )
      }
      onClick={() => upgradePlanName && onUpgradeClick()}
    >
      {upgradePlanName ? `Upgrade to ${upgradePlanName}` : 'Talk to sales'}
      <ArrowRight data-icon="inline-end" />
    </Button>
  )

  if (variant === 'alert') {
    return (
      <Alert variant="warning" outlined={false} className={bannerClassName} data-testid="seat-limit-banner">
        <Lock className="size-4" />
        <AlertDescription>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col">
              <span className="font-semibold text-foreground">{title}</span>
              <span>{body}</span>
            </div>
            {cta}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (isDismissed) return null

  return (
    <Alert variant="info" className={bannerClassName} data-testid="seat-limit-banner">
      <AlertDescription>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">{title}</span>
            <span className="text-muted-foreground">
              Remove one to add another, or{' '}
              {upgradePlanName ? (
                <Link
                  variant="inherit"
                  className="font-medium underline"
                  render={<NextLink href={plansHref} />}
                  onClick={onUpgradeClick}
                >
                  upgrade to {upgradePlanName}.
                </Link>
              ) : (
                <Link
                  variant="inherit"
                  className="font-medium underline"
                  href={salesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  talk to us about a higher limit.
                </Link>
              )}{' '}
              <ArrowRight className="inline size-4 align-text-bottom" />
            </span>
          </div>
          <Button variant="outline" className="shrink-0" onClick={onDismiss}>
            Got it
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
