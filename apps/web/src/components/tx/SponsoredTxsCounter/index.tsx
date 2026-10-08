import type { ReactElement } from 'react'
import { MixpanelEventParams, PlanSelectionEntryPoint, UpgradeFeature, UpgradeLocation } from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { SponsoredTxsCounterView } from '@views/components/tx/SponsoredTxsCounter/SponsoredTxsCounterView'

export { _formatResetsAt } from '@views/components/tx/SponsoredTxsCounter/SponsoredTxsCounterView'

const PROMPT = {
  [MixpanelEventParams.FEATURE]: UpgradeFeature.SPONSORED_TX,
  [MixpanelEventParams.LOCATION]: UpgradeLocation.TX_FLOW_GAS,
}

const UPGRADE_MIXPANEL_PARAMS = { [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.UPGRADE_PROMPT, ...PROMPT }

const SponsoredTxsCounter = ({
  left,
  quota,
  resetsAt,
  isSubscription,
  isPro,
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
}): ReactElement => {
  useTrackOnce(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, PROMPT, !isPro)

  return (
    <SponsoredTxsCounterView
      left={left}
      quota={quota}
      resetsAt={resetsAt}
      isSubscription={isSubscription}
      isPro={isPro}
      upgradeMixpanelParams={UPGRADE_MIXPANEL_PARAMS}
    />
  )
}

export default SponsoredTxsCounter
