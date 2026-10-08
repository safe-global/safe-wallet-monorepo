import {
  trackEvent,
  MixpanelEventParams,
  PlanSelectionEntryPoint,
  UpgradeFeature,
  UpgradeLocation,
} from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { trackPlanSelectionStarted } from '../../Plans/planSelection'
import type { PolicyLock } from '@views/features/spaces/components/Policies/policyLock'
import { PolicyUpsellBannerView } from '@views/features/spaces/components/Policies/PolicyUpsellBanner/PolicyUpsellBannerView'

type PolicyUpsellBannerProps = Pick<PolicyLock, 'planName' | 'workspaceName' | 'onUpgrade'>

const PROMPT = {
  [MixpanelEventParams.FEATURE]: UpgradeFeature.POLICIES,
  [MixpanelEventParams.LOCATION]: UpgradeLocation.POLICIES_PAGE,
}

const PolicyUpsellBanner = ({ planName, workspaceName, onUpgrade }: PolicyUpsellBannerProps) => {
  useTrackOnce(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, PROMPT)

  return (
    <PolicyUpsellBannerView
      planName={planName}
      workspaceName={workspaceName}
      onUpgrade={() => {
        trackEvent(POLICY_EVENTS.POLICY_UPSELL_UPGRADE_CLICKED)
        trackPlanSelectionStarted({
          [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.UPGRADE_PROMPT,
          ...PROMPT,
        })
        onUpgrade()
      }}
    />
  )
}

export default PolicyUpsellBanner
