import type { ReactNode } from 'react'
import { Fuel, Info, WalletCards } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { formatDate } from '@safe-global/utils/utils/date'
import type { Meter, PlansData } from './types'

const TRIAL_TOOLTIP =
  "Your paid subscription only starts after you add billing details. If you don't add them before the trial ends, your Workspace will be locked. Your Safe accounts remain available outside the Workspace."

export const remaining = ({ used, quota }: Meter): number | null => (quota === null ? null : Math.max(quota - used, 0))

const InfoTip = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger render={<span className="inline-flex" />}>
      <Info className="size-4 text-muted-foreground" />
    </TooltipTrigger>
    <TooltipContent className="max-w-[260px]">{text}</TooltipContent>
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
  meter: Meter
}) => {
  const left = remaining(meter)

  return (
    <Card variant="muted" size="sm" className="flex-1">
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card">{icon}</span>
          <Typography variant="paragraph-medium">{label}</Typography>
          <InfoTip text={tooltip} />
        </div>
        <Typography variant="paragraph-bold" className="whitespace-nowrap">
          {left === null ? (
            'Unlimited'
          ) : (
            <>
              {left} <span className="font-normal text-muted-foreground">/ {meter.quota}</span>
            </>
          )}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function PlanStatusCard({ plan, safeAccounts, sponsoredTxs }: Omit<PlansData, 'tiers'>) {
  const isTrial = plan?.status === 'trialing'
  const endDate = plan?.periodEndsAt ? formatDate(new Date(plan.periodEndsAt).getTime()) : null

  return (
    <Card radius="xl">
      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Typography variant="h4">{plan?.name ?? 'Free'}</Typography>
              {plan && (
                <Badge variant="success" size="status" shape="status">
                  {isTrial ? 'Free trial' : 'Active'}
                </Badge>
              )}
            </div>
            {endDate && (
              <Typography className="flex items-center gap-1">
                {isTrial
                  ? `Your free trial is active until ${endDate}. Add billing details before then to keep your Workspace.`
                  : `Your plan renews on ${endDate}.`}
                {isTrial && <InfoTip text={TRIAL_TOOLTIP} />}
              </Typography>
            )}
          </div>
          {isTrial && <Button size="lg">Add billing details</Button>}
        </div>
      </CardContent>

      <CardContent>
        <div className="flex flex-col gap-4 md:flex-row">
          <UsageMeter
            icon={<WalletCards className="size-5" />}
            label="Safe accounts available"
            tooltip="Safe accounts your plan lets you add to this Workspace."
            meter={safeAccounts}
          />
          <UsageMeter
            icon={<Fuel className="size-5" />}
            label="Sponsored transactions remaining"
            tooltip="Sponsored transactions left in the current billing period."
            meter={sponsoredTxs}
          />
        </div>
      </CardContent>
    </Card>
  )
}
