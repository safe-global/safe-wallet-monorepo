import NextLink from 'next/link'
import { ArrowRight, Lock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { SUPPORT_CHAT_URL } from '@/config/constants'
import { useSeatUpsell } from '../../hooks/useSeatUpsell'

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
  if (limit === null) return null

  const title = `${tierName ?? 'Your plan'} includes ${limit} Safe accounts`
  const body = upgradePlanName
    ? 'Upgrade for more, or remove one to add another.'
    : 'Remove one to add another, or talk to us about a higher limit.'
  // The chooser's banner carries the primary action; on the page it stays a quiet outline next to the table.
  const isAlert = variant === 'alert'
  const cta = (
    <Button
      variant={isAlert ? 'default' : 'outline'}
      size="sm"
      accentIcon={isAlert}
      className="shrink-0"
      render={
        upgradePlanName ? (
          <NextLink href={plansHref} />
        ) : (
          <a href={SUPPORT_CHAT_URL} target="_blank" rel="noopener noreferrer" />
        )
      }
    >
      {upgradePlanName ? `Upgrade to ${upgradePlanName}` : 'Talk to sales'}
      {isAlert && <ArrowRight data-icon="inline-end" />}
    </Button>
  )

  if (isAlert) {
    return (
      <Alert variant="warning" outlined={false} className={className} data-testid="seat-limit-banner">
        <Lock className="size-4" />
        <AlertDescription>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{title}</span>
              <span>{body}</span>
            </div>
            {cta}
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card radius="lg" className={className} data-testid="seat-limit-banner">
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <Typography variant="paragraph-medium">{title}</Typography>
            <Typography variant="paragraph-small" color="muted">
              {body}
            </Typography>
          </div>
          {cta}
        </div>
      </CardContent>
    </Card>
  )
}
