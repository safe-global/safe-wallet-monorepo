import type { ReactElement } from 'react'
import Link from 'next/link'
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { ResolvedSidebarItem } from '../../types'
import { getSidebarItemTestId } from '../../utils'
import css from '../../styles.module.css'
import { trackEvent, OVERVIEW_EVENTS, MixpanelEventParams } from '@/services/analytics'
import type { AnalyticsEvent } from '@/services/analytics/types'
import { GA_LABEL_TO_MIXPANEL_PROPERTY } from '@/services/analytics/ga-mixpanel-mapping'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { BRIDGE_EVENTS, BRIDGE_LABELS } from '@/services/analytics/events/bridge'
import { STAKE_EVENTS, STAKE_LABELS } from '@/services/analytics/events/stake'
import { EARN_EVENTS, EARN_LABELS } from '@/services/analytics/events/earn'
import { AppRoutes } from '@/config/routes'

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

const getBadgeAriaLabel = (label: string, count: number): string =>
  `${count} ${label} ${count === 1 ? 'notification' : 'notifications'}`

interface NavItemProps {
  item: ResolvedSidebarItem
  /** Spaces sidebar: per-label test ids; no tooltip wrapper so disabled state reaches the DOM. */
  isSpacesVariant?: boolean
}

export const NavItem = ({ item, isSpacesVariant = false }: NavItemProps): ReactElement => {
  const dataTestId = isSpacesVariant ? getSidebarItemTestId(item.label) : 'sidebar-list-item'

  const handleClick = () => {
    if (item.disabled) return
    const customEvent = customNavEvents[item.href]
    if (customEvent) {
      trackEvent({ ...customEvent.event, label: customEvent.label }, customEvent.mixpanelParams)
    }
    trackEvent({ ...OVERVIEW_EVENTS.SIDEBAR_CLICKED }, { [MixpanelEventParams.SIDEBAR_ELEMENT]: item.label })
  }

  const menuButton = (
    <SidebarMenuButton
      size="lg"
      isActive={item.isActive}
      disabled={item.disabled}
      className={`h-9 gap-3 ${css.sidebarInteractive} ${css.sidebarNavItem}`}
      render={!item.disabled ? <Link href={item.link} /> : undefined}
      data-testid={dataTestId}
      onClick={handleClick}
    >
      <Tooltip>
        <TooltipTrigger>
          <item.icon />
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
      <span>{item.label}</span>
    </SidebarMenuButton>
  )

  const interactive = isSpacesVariant ? (
    menuButton
  ) : (
    <Tooltip>
      <TooltipTrigger className="block w-full">{menuButton}</TooltipTrigger>
      {item.disabled && <TooltipContent side="right">You need to activate your Safe first.</TooltipContent>}
    </Tooltip>
  )

  return (
    <SidebarMenuItem className="relative">
      {interactive}
      {item.badge !== undefined && item.badge > 0 && (
        <>
          <span className={css.transactionsBadge} aria-label={getBadgeAriaLabel(item.label, item.badge)}>
            {item.badge}
          </span>
          <span className={css.transactionsBadgeDot} aria-hidden />
        </>
      )}
    </SidebarMenuItem>
  )
}
