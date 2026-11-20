import type { ReactElement } from 'react'
import NextLink from 'next/link'
import { ArrowRight, Info } from 'lucide-react'
import { Button } from '@safe-global/views/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@safe-global/views/components/ui/tooltip'
import { Typography } from '@safe-global/views/components/ui/typography'
import { AppRoutes } from '@/config/routes'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import { maybePlural } from '@safe-global/utils/utils/formatters'
import {
  MixpanelEventParams,
  PlanSelectionEntryPoint,
  UpgradeFeature,
  UpgradeLocation,
} from '@/services/analytics/mixpanel-events'
import Track from '@/components/common/Track'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'

const PROMPT = {
  [MixpanelEventParams.FEATURE]: UpgradeFeature.SPONSORED_TX,
  [MixpanelEventParams.LOCATION]: UpgradeLocation.TX_FLOW_GAS,
}

/** "Nov 1, 00:00 UTC": the reset moment of a sponsored-transactions cycle, always in UTC so every member reads the same. */
export const formatResetsAt = (iso: string | null): string | null => {
  if (!iso) return null
  const timestamp = Date.parse(iso)
  if (Number.isNaN(timestamp)) return null
  const formatted = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'UTC',
  }).format(timestamp)
  return `${formatted} UTC`
}

const SponsoredTxsCounter = ({
  left,
  quota,
  resetsAt,
  isSubscription,
  isPro,
  onUpgrade,
}: {
  /** Null reads as unlimited. */
  left: number | null
  /** The plan's allowance per cycle on a Pro Safe, the free daily limit otherwise. */
  quota: number | null
  resetsAt: string | null
  /** Counts a plan's allowance per cycle instead of the free daily limit. */
  isSubscription: boolean
  /** Shows the Pro chip instead of the upgrade button; null (plan unknown, or Pro does not apply as in Safe creation) shows neither. */
  isPro: boolean | null
  /** Opens the upgrade in place instead of leaving for the Workspaces page. */
  onUpgrade?: () => void
}): ReactElement => {
  const resets = formatResetsAt(resetsAt)
  const isOutOfFreeTxs = Boolean(onUpgrade) && isPro === false && !isSubscription && left === 0
  useTrackOnce(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, PROMPT, !isPro)

  return (
    <div className="flex items-center justify-between gap-3 bg-muted px-4 py-2" data-testid="sponsored-txs-counter">
      <div className="flex flex-col gap-0.5">
        <Typography variant="paragraph-small" className="flex flex-wrap items-baseline gap-1">
          {left === null ? (
            <span>Unlimited sponsored transactions</span>
          ) : isSubscription && quota !== null ? (
            <span>
              <span className="font-semibold" data-testid="sponsored-txs-left">
                {left}
              </span>
              <span className="text-muted-foreground">/{quota} sponsored transactions left</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span data-testid="sponsored-txs-left">
                <span className="font-semibold">{left}</span> free transactions left today
              </span>
              {quota !== null && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span className="leading-none" data-testid="sponsored-txs-info">
                        <Info className="size-4 text-muted-foreground" />
                      </span>
                    }
                  />
                  <TooltipContent>
                    {quota} transaction{maybePlural(quota)} per day for free
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
          )}
          {resets && <span className="text-xs text-muted-foreground">· Resets {resets}</span>}
        </Typography>
        {isOutOfFreeTxs && (
          <Typography variant="paragraph-small" color="muted" data-testid="sponsored-txs-out">
            You&apos;ve used today&apos;s free transactions. Safe Pro includes 50 a month.
          </Typography>
        )}
      </div>

      {isPro === null ? (
        <span className="block h-5 w-8 shrink-0" aria-hidden />
      ) : isPro ? (
        <span className="block h-5 w-8 shrink-0" role="img" aria-label="Safe Pro">
          <ProChip className="size-full" />
        </span>
      ) : (
        <Track
          {...SAFE_PRO_EVENTS.PLAN_SELECTION_STARTED}
          mixpanelParams={{ [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.UPGRADE_PROMPT, ...PROMPT }}
          className="shrink-0"
        >
          <Button
            variant="outline"
            size="xs"
            render={onUpgrade ? undefined : <NextLink href={AppRoutes.welcome.spaces} />}
            onClick={onUpgrade}
            data-testid="sponsored-txs-upgrade"
          >
            Upgrade to
            <span className="block h-4 w-6" aria-label="Safe Pro">
              <ProChip className="size-full" />
            </span>
            <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
          </Button>
        </Track>
      )}
    </div>
  )
}

export default SponsoredTxsCounter
