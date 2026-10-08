import type { LinkProps } from 'next/link'
import {
  MixpanelEventParams,
  PlanSelectionEntryPoint,
  UpgradeLocation,
  type UpgradeFeature,
} from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { trackPlanSelectionStarted } from '@/features/spaces'
import { SafeProLockView } from '@views/components/common/SafeProLock/SafeProLockView'

/** Safe Pro upsell replacing an add-policy action (proposer, spending limit) when `usePlanGate` requires an upgrade. */
const SafeProLock = ({ title, href, feature }: { title: string; href: LinkProps['href']; feature: UpgradeFeature }) => {
  const prompt = {
    [MixpanelEventParams.FEATURE]: feature,
    [MixpanelEventParams.LOCATION]: UpgradeLocation.SETTINGS_SETUP,
  }
  useTrackOnce(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, prompt)

  return (
    <SafeProLockView
      title={title}
      href={href}
      onExplore={() =>
        trackPlanSelectionStarted({
          [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.UPGRADE_PROMPT,
          ...prompt,
        })
      }
    />
  )
}

export default SafeProLock
