import { useState } from 'react'
import NextLink from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { sessionItem } from '@/services/local-storage/session'
import { useCurrentSpaceId } from '../../hooks/useCurrentSpaceId'
import { useSeatUpsell } from '../../hooks/useSeatUpsell'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'

const dismissedBanners = sessionItem<Record<string, true>>('seatLimitBannerDismissed')

/** Shown once the Workspace holds as many Safes as its plan covers: upgrade when a bigger plan is offered, else sales. */
export default function SeatLimitBanner({
  variant = 'card',
  className,
}: {
  /** `card` sits on the Safe accounts page, `alert` inside the add-accounts chooser. */
  variant?: 'card' | 'alert'
  className?: string
}) {
  const { tierName, limit, upgradePlanName, plansHref } = useSeatUpsell()
  const spaceId = useCurrentSpaceId()
  const [isDismissed, setIsDismissed] = useState(() => Boolean(spaceId && dismissedBanners.get()?.[spaceId]))
  if (limit === null) return null

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
          <a href={CONTACT_SALES_URL} target="_blank" rel="noopener noreferrer" />
        )
      }
    >
      {upgradePlanName ? `Upgrade to ${upgradePlanName}` : 'Talk to sales'}
      <ArrowRight data-icon="inline-end" />
    </Button>
  )

  if (variant === 'alert') {
    return (
      <Alert variant="warning" outlined={false} className={className} data-testid="seat-limit-banner">
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

  const dismiss = () => {
    if (spaceId) dismissedBanners.set({ ...(dismissedBanners.get() ?? {}), [spaceId]: true })
    setIsDismissed(true)
  }

  return (
    <Alert variant="info" className={className} data-testid="seat-limit-banner">
      <AlertDescription>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">{title}</span>
            <span className="text-muted-foreground">
              Remove one to add another, or{' '}
              {upgradePlanName ? (
                <Link variant="inherit" className="font-medium underline" render={<NextLink href={plansHref} />}>
                  upgrade to {upgradePlanName}.
                </Link>
              ) : (
                <Link
                  variant="inherit"
                  className="font-medium underline"
                  href={CONTACT_SALES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  talk to us about a higher limit.
                </Link>
              )}{' '}
              <ArrowRight className="inline size-4 align-text-bottom" />
            </span>
          </div>
          <Button variant="outline" className="shrink-0" onClick={dismiss}>
            Got it
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
