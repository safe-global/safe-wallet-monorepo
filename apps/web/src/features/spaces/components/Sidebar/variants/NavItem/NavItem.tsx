import type { ReactElement, ReactNode } from 'react'
import type { ResolvedSidebarItem } from '@views/features/spaces/components/Sidebar/types'
import { getSidebarItemTestId } from '../../utils'
import { trackEvent, OVERVIEW_EVENTS, MixpanelEventParams } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { GA_LABEL_TO_MIXPANEL_PROPERTY } from '@/services/analytics/ga-mixpanel-mapping'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { BRIDGE_EVENTS, BRIDGE_LABELS } from '@/services/analytics/events/bridge'
import { STAKE_EVENTS, STAKE_LABELS } from '@/services/analytics/events/stake'
import { EARN_EVENTS, EARN_LABELS } from '@/services/analytics/events/earn'
import { AppRoutes } from '@/config/routes'
import { PlanSelectionEntryPoint } from '@/services/analytics/mixpanel-events'
import { trackPlanSelectionStarted } from '../../../Plans/planSelection'
import { NavItemView } from '@views/features/spaces/components/Sidebar/variants/NavItem/NavItemView'

const customNavEvents: Record<
  string,
  { event: AnalyticsEvent; label: string; mixpanelParams?: Record<string, string> }
> = {
  [AppRoutes.bridge]: { event: BRIDGE_EVENTS.OPEN_BRIDGE, label: BRIDGE_LABELS.sidebar },
  [AppRoutes.swap]: {
    event: SWAP_EVENTS.OPEN_SWAPS,
    label: SWAP_LABELS.sidebar,
    mixpanelParams: { [MixpanelEventParams.ENTRY_POINT]: GA_LABEL_TO_MIXPANEL_PROPERTY[SWAP_LABELS.sidebar] },
  },
  [AppRoutes.stake]: { event: STAKE_EVENTS.OPEN_STAKE, label: STAKE_LABELS.sidebar },
  [AppRoutes.earn]: { event: EARN_EVENTS.OPEN_EARN_PAGE, label: EARN_LABELS.sidebar },
}

interface NavItemProps {
  item: ResolvedSidebarItem | null
  /** Spaces sidebar: per-label test ids; no tooltip wrapper so disabled state reaches the DOM. */
  isSpacesVariant?: boolean
  /** Show skeleton loading state instead of actual item content. */
  isLoading?: boolean
  /**
   * UI belonging to this item, e.g. a dialog it opens. Hosted in the item's own list element, and
   * kept mounted in the skeleton state so a loading flip can't tear down UI the user has open.
   */
  children?: ReactNode
}

export const NavItem = ({ item, isSpacesVariant = false, isLoading = false, children }: NavItemProps): ReactElement => {
  const dataTestId = item
    ? (item.testId ?? (isSpacesVariant ? getSidebarItemTestId(item.label) : 'sidebar-list-item'))
    : 'sidebar-list-item'

  const handleItemClick = () => {
    if (!item || item.disabled) return

    if (item.onSelect) {
      item.onSelect()
    } else if (item.href) {
      const customEvent = customNavEvents[item.href]
      if (customEvent) {
        trackEvent({ ...customEvent.event, label: customEvent.label }, customEvent.mixpanelParams)
      }
      if (item.href === AppRoutes.spaces.plans) {
        trackPlanSelectionStarted({ [MixpanelEventParams.ENTRY_POINT]: PlanSelectionEntryPoint.SIDEBAR })
      }
    }

    trackEvent({ ...OVERVIEW_EVENTS.SIDEBAR_CLICKED }, { [MixpanelEventParams.SIDEBAR_ELEMENT]: item.label })
  }

  return (
    <NavItemView
      item={item}
      isSpacesVariant={isSpacesVariant}
      isLoading={isLoading}
      dataTestId={dataTestId}
      onItemClick={handleItemClick}
    >
      {children}
    </NavItemView>
  )
}
