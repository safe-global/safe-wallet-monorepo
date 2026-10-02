import { useEffect, type ReactElement } from 'react'
import NextLink from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppRoutes } from '@/config/routes'
import { trackPlanSelectionStarted, useSafeProAccess } from '@/features/spaces'
import {
  MixpanelEventParams,
  PlanSelectionEntryPoint,
  UpgradeFeature,
  UpgradeLocation,
  trackEvent,
} from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'

const PROMPT = {
  [MixpanelEventParams.FEATURE]: UpgradeFeature.SAFE_SHIELD_CHECKS,
  [MixpanelEventParams.LOCATION]: UpgradeLocation.TX_FLOW_SAFE_SHIELD,
}

export const ProChecksRow = ({ hasProFeatures }: { hasProFeatures: boolean }): ReactElement => {
  const { spaceId } = useSafeProAccess()
  const href = spaceId ? { pathname: AppRoutes.spaces.plans, query: { spaceId } } : AppRoutes.welcome.spaces
  useEffect(() => {
    if (!hasProFeatures) trackEvent(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, PROMPT)
  }, [hasProFeatures])

  return (
    <div className="flex min-h-11 items-center justify-between rounded-t-md bg-muted p-2" data-testid="pro-checks-row">
      <span className="block h-5 w-8" aria-label="Safe Pro">
        <ProChip className="size-full" />
      </span>
      {!hasProFeatures && (
        <Button
          variant="outline"
          size="xs"
          render={<NextLink href={href} />}
          data-testid="pro-upgrade-link"
          onClick={() =>
            trackPlanSelectionStarted({
              [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.UPGRADE_PROMPT,
              ...PROMPT,
            })
          }
        >
          Upgrade
          <ArrowRight data-icon="inline-end" className="text-badge-dot-success" />
        </Button>
      )}
    </div>
  )
}
