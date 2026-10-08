import { useState } from 'react'
import { sessionItem } from '@/services/local-storage/session'
import { useCurrentSpaceId } from '../../hooks/useCurrentSpaceId'
import { useSeatUpsell } from '../../hooks/useSeatUpsell'
import { CONTACT_SALES_URL } from '@/features/spaces/constants'
import {
  MixpanelEventParams,
  PlanSelectionEntryPoint,
  UpgradeFeature,
  UpgradeLocation,
} from '@/services/analytics/mixpanel-events'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { trackPlanSelectionStarted } from '../Plans/planSelection'
import { SeatLimitBannerView } from '@views/features/spaces/components/SafeAccounts/SeatLimitBannerView'

const PROMPT = {
  [MixpanelEventParams.FEATURE]: UpgradeFeature.SAFE_ACCOUNTS_LIMIT,
  [MixpanelEventParams.LOCATION]: UpgradeLocation.SAFE_ACCOUNTS_PAGE,
}

const dismissedBanners = sessionItem<Record<string, true>>('seatLimitBannerDismissed')

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
  const spaceId = useCurrentSpaceId()
  const [isDismissed, setIsDismissed] = useState(() => Boolean(spaceId && dismissedBanners.get()?.[spaceId]))
  useTrackOnce(SAFE_PRO_EVENTS.UPGRADE_PROMPT_VIEWED, PROMPT, limit !== null && Boolean(upgradePlanName))
  if (limit === null) return null

  const dismiss = () => {
    if (spaceId) dismissedBanners.set({ ...(dismissedBanners.get() ?? {}), [spaceId]: true })
    setIsDismissed(true)
  }

  return (
    <SeatLimitBannerView
      variant={variant}
      bannerClassName={className}
      tierName={tierName}
      limit={limit}
      upgradePlanName={upgradePlanName}
      plansHref={plansHref}
      salesUrl={CONTACT_SALES_URL}
      onUpgradeClick={() =>
        trackPlanSelectionStarted({
          [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.UPGRADE_PROMPT,
          ...PROMPT,
        })
      }
      isDismissed={isDismissed}
      onDismiss={dismiss}
    />
  )
}
