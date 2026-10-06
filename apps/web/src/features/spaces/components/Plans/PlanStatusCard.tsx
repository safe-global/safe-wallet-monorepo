import type { ReactNode } from 'react'
import { Fuel, Info, WalletCards } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import { cn } from '@/utils/cn'
import { TRIAL_ENDING_SOON_DAYS, trialLabel } from '../../hooks/billing/subscription'
import { TRIAL_DISCLAIMER } from '../../constants'
import type { CurrentBadge } from './PlanCards'
import type { Meter, PlanSummary } from './types'
import { StatusDot } from './v2/StatusDot'

export const _remaining = ({ used, quota }: Meter): number | null => (quota === null ? null : Math.max(quota - used, 0))

export const seatsTooltip = (tierName: string | undefined, quota: number | null | undefined) =>
  `${tierName ? `Your ${tierName} plan` : 'Your plan'} covers ${quota ?? 'unlimited'} Safe accounts. At ${quota ?? 'unlimited'}, remove one from this Workspace to add another. Safe accounts you leave out remain available in My accounts.`

/** `countdownDays`: days left when the trial label starts counting down. */
export const getCurrentBadge = (plan: PlanSummary | null, countdownDays?: number): CurrentBadge | undefined => {
  if (!plan) return undefined
  if (plan.status === 'active') return { label: 'Active', variant: 'brand' }
  const endingSoon = plan.daysLeft !== null && plan.daysLeft <= TRIAL_ENDING_SOON_DAYS
  return {
    label: trialLabel(plan.daysLeft, countdownDays),
    variant: endingSoon ? 'warning' : 'brand',
  }
}

export const InfoTip = ({ text, 'data-testid': testId }: { text: string; 'data-testid'?: string }) => (
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex shrink-0" data-testid={testId} />}>
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
  isV2,
}: {
  icon: ReactNode
  label: string
  tooltip?: string
  meter: Meter | null
  isV2?: boolean
}) => {
  const left = meter && _remaining(meter)
  const isExhausted = left === 0

  return (
    <Card
      variant={isV2 ? 'muted-secondary' : 'muted'}
      radius={isV2 ? 'lg-xl' : undefined}
      size="sm"
      bordered={isV2}
      className="flex-1"
    >
      <CardContent className="flex items-center justify-between">
        <div className="mr-4 flex min-w-0 items-center gap-3">
          <Avatar>
            <AvatarFallback surface="card">{icon}</AvatarFallback>
          </Avatar>
          <Typography variant="paragraph-medium">{label}</Typography>
          {tooltip && <InfoTip text={tooltip} />}
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

const daysLeftText = (daysLeft: number) => `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`

const statusText = (
  plan: PlanSummary | null,
  endDate: string | null,
  isSeatsFull: boolean,
  withDaysLeft = false,
): string | null => {
  if (plan === null) {
    return 'Your Workspace is locked until you choose a plan. Your Safe accounts remain available in My accounts.'
  }
  if (plan.status === 'active') {
    return isSeatsFull ? 'Safe accounts above the limit remain available in My accounts.' : null
  }
  const until = endDate ?? 'the end of the period'
  return !plan.hasPaymentMethod
    ? `Your free access is active until ${until}. Add a payment method before then or choose another plan to keep your Workspace.`
    : withDaysLeft && plan.daysLeft != null
      ? `Active until ${until} · ${daysLeftText(plan.daysLeft)}`
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
  appearance = 'launch',
}: {
  plan: PlanSummary | null
  safeAccounts: Meter | null
  sponsoredTxs: Meter | null
  tierName?: string
  onManage?: () => void
  isManaging?: boolean
  /** Shows "Manage plan": on by default for a paid plan, and worth keeping for a lapsed one that still has a Stripe portal. */
  canManage?: boolean
  /** v2 style: bordered tiles, a neutral badge with a status dot, and the countdown in the status line. */
  appearance?: 'launch' | 'v2'
}) {
  const isTrial = plan?.status === 'trialing'
  const endDate = plan?.periodEndsAt ? formatDate(new Date(plan.periodEndsAt).getTime()) : null
  const isV2 = appearance === 'v2'
  // v2 shows days left for the whole free access, not just the last week.
  const badge = getCurrentBadge(plan, isV2 ? Number.POSITIVE_INFINITY : undefined)
  const isEndingSoon = badge?.variant === 'warning'
  const badgeVariant = isV2 ? 'subtle' : badge?.variant
  const text = statusText(plan, endDate, safeAccounts !== null && _remaining(safeAccounts) === 0, isV2)

  return (
    <Card radius="xl">
      <CardContent>
        <div className="@container flex flex-col gap-4">
          <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-start @2xl:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Typography variant="h4">{plan?.name ?? 'No active plan'}</Typography>
                {badge && (
                  <Badge
                    variant={badgeVariant}
                    size="status"
                    shape="status"
                    className={cn(isV2 && 'gap-1.5 text-foreground')}
                    data-testid="plan-status-badge"
                  >
                    {isV2 && <StatusDot isWarning={isEndingSoon} />}
                    {badge.label}
                  </Badge>
                )}
              </div>
              {text && (
                <Typography className="flex items-center gap-1">
                  {text}
                  {isTrial && !plan?.hasPaymentMethod && (
                    <InfoTip text={TRIAL_DISCLAIMER} data-testid="trial-disclaimer" />
                  )}
                </Typography>
              )}
            </div>
            {canManage && (
              <Button variant="outline" size="lg" onClick={onManage} disabled={isManaging}>
                Manage plan
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-4 @2xl:flex-row">
            <UsageMeter
              icon={<WalletCards className="size-5" strokeWidth={1.5} />}
              label="Safe accounts available"
              tooltip={seatsTooltip(tierName, safeAccounts?.quota)}
              meter={safeAccounts}
              isV2={isV2}
            />
            <UsageMeter
              icon={<Fuel className="size-5" strokeWidth={1.5} />}
              label="Sponsored transactions available"
              meter={sponsoredTxs}
              isV2={isV2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
