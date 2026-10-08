import type { ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import { trackPlanSelectionStarted, useSafeProAccess } from '@/features/spaces'
import { MixpanelEventParams, PlanSelectionEntryPoint, UpgradeFeature, UpgradeLocation } from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { ProChecksRowView } from '@views/features/safe-shield/components/ProChecksRowView'

const PROMPT = {
  [MixpanelEventParams.FEATURE]: UpgradeFeature.SAFE_SHIELD_CHECKS,
  [MixpanelEventParams.LOCATION]: UpgradeLocation.TX_FLOW_SAFE_SHIELD,
}

export const ProChecksRow = ({ hasProFeatures }: { hasProFeatures: boolean }): ReactElement => {
  const { spaceId } = useSafeProAccess()
  const href = spaceId ? { pathname: AppRoutes.spaces.plans, query: { spaceId } } : AppRoutes.welcome.spaces
  useTrackOnce(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, PROMPT, !hasProFeatures)

  return (
    <ProChecksRowView
      hasProFeatures={hasProFeatures}
      href={href}
      onUpgradeClick={() =>
        trackPlanSelectionStarted({
          [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.UPGRADE_PROMPT,
          ...PROMPT,
        })
      }
    />
  )
}
