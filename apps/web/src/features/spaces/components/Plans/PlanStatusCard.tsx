import type { ReactNode } from 'react'
import { Fuel, Info, WalletCards } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import { TRIAL_DISCLAIMER } from '@/features/safe-pro-announcement'
import { TRIAL_ENDING_SOON_DAYS, trialLabel } from '../../hooks/billing/subscription'
import type { CurrentBadge } from './PlanCards'
import type { Meter, PlanSummary } from './types'

export const _remaining = ({ used, quota }: Meter): number | null => (quota === null ? null : Math.max(quota - used, 0))

export const seatsTooltip = (tierName: string | undefined, quota: number | null | undefined) =>
  `${tierName ?? 'Your plan'} covers ${quota ?? 'unlimited'} Safe accounts. At ${quota ?? 'unlimited'}, remove one from this Workspace to add another. Safe accounts you leave out remain available in My accounts.`

/** The badge both the status card and the current plan card wear: trial with its countdown, or Active. */
export const getCurrentBadge = (plan: PlanSummary | null): CurrentBadge | undefined => {
  if (!plan) return undefined
  if (plan.status === 'active') return { label: 'Active', variant: 'brand' }
  const endingSoon = plan.daysLeft !== null && plan.daysLeft <= TRIAL_ENDING_SOON_DAYS
  return {
    label: trialLabel(plan.daysLeft),
    variant: endingSoon ? 'warning' : 'brand',
  }
}

export const InfoTip = ({ text, 'data-testid': testId }: { text: string; 'data-testid'?: string }) => (
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex" data-testid={testId} />}>
      <Info className="size-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent className="max-w-65">{text}</TooltipContent>
  </Tooltip>
)

const UsageMeter = ({
  icon,
  label,
  tooltip,
  meter,
}: {
  icon: ReactNode
  label: string
  tooltip: string
  meter: Meter | null
}) => {
  const left = meter && _remaining(meter)
  const isExhausted = left === 0

  return (
    <Card variant="muted" size="sm" className="flex-1">
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback surface="card">{icon}</AvatarFallback>
          </Avatar>
          <Typography variant="paragraph-medium">{label}</Typography>
          <InfoTip text={tooltip} />
        </div>
        <Typography
          variant="paragraph-bold"
          className="flex items-center gap-1.5 whitespace-nowrap"
          data-testid={isExhausted ? 'meter-exhausted' : undefined}
        >
          {isExhausted && <span aria-hidden className="size-1.5 rounded-full bg-destructive" />}
          {meter === null ? (
            '—'
          ) : left === null ? (
            'Unlimited'
          ) : (
            <>
              <span data-testid="meter-left">{left}</span>{' '}
              <Typography variant="paragraph-small" color="muted">
                / {meter.quota}
              </Typography>
            </>
          )}
        </Typography>
      </CardContent>
    </Card>
  )
}

const statusText = (plan: PlanSummary | null, endDate: string | null, isEndingSoon: boolean): string => {
  if (plan === null) {
    return 'Your Workspace is locked until you choose a plan. Your Safe accounts remain available outside the Workspace.'
  }
  if (plan.status === 'active') return 'Safe accounts above the limit remain available outside the Workspace.'
  const until = endDate ?? 'the end of the period'
  return isEndingSoon && !plan.hasPaymentMethod
    ? `Your free access is active until ${until}. Add a payment method before then or choose another plan to keep your Workspace.`
    : `Active until ${until}.`
}

export default function PlanStatusCard({
  plan,
  safeAccounts,
  sponsoredTxs,
  tierName,
  onManage,
  isManaging,
  canManage = plan?.status === 'active',
}: {
  plan: PlanSummary | null
  safeAccounts: Meter | null
  sponsoredTxs: Meter | null
  tierName?: string
  onManage?: () => void
  isManaging?: boolean
  /** Shows "Manage plan": on by default for a paid plan, and worth keeping for a lapsed one that still has a Stripe portal. */
  canManage?: boolean
}) {
  const isTrial = plan?.status === 'trialing'
  const endDate = plan?.periodEndsAt ? formatDate(new Date(plan.periodEndsAt).getTime()) : null
  const badge = getCurrentBadge(plan)
  const isEndingSoon = badge?.variant === 'warning'

  return (
    <Card radius="xl">
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Typography variant="h4">{plan?.name ?? 'No active plan'}</Typography>
                {badge && (
                  <Badge variant={badge.variant} size="status" shape="status" data-testid="plan-status-badge">
                    {badge.label}
                  </Badge>
                )}
              </div>
              <Typography className="flex items-center gap-1">
                {statusText(plan, endDate, isEndingSoon)}
                {isTrial && !plan?.hasPaymentMethod && (
                  <InfoTip text={TRIAL_DISCLAIMER} data-testid="trial-disclaimer" />
                )}
              </Typography>
            </div>
            {canManage && (
              <Button variant="outline" size="lg" onClick={onManage} disabled={isManaging}>
                Manage plan
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <UsageMeter
              icon={<WalletCards className="size-5" strokeWidth={1.5} />}
              label="Safe accounts available"
              tooltip={seatsTooltip(tierName, safeAccounts?.quota)}
              meter={safeAccounts}
            />
            <UsageMeter
              icon={<Fuel className="size-5" strokeWidth={1.5} />}
              label="Sponsored transactions remaining"
              tooltip="Transactions above the limit bill at pay-as-you-go rates."
              meter={sponsoredTxs}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
