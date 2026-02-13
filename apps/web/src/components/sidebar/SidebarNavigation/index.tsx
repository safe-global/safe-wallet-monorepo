import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import React, { useContext, useMemo, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { Divider, ListItemButton } from '@mui/material'

import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemCounter,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import { type NavItem, navItems } from './config'
import useSafeInfo from '@/hooks/useSafeInfo'
import { AppRoutes, UNDEPLOYED_SAFE_BLOCKED_ROUTES } from '@/config/routes'
import { useQueuedTxsLength } from '@/hooks/useTxQueue'
import { useCurrentChain } from '@/hooks/useChains'
import { isRouteEnabled } from '@/utils/chains'
import { trackEvent, OVERVIEW_EVENTS } from '@/services/analytics'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { GA_LABEL_TO_MIXPANEL_PROPERTY } from '@/services/analytics/ga-mixpanel-mapping'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { STAKE_EVENTS, STAKE_LABELS } from '@/services/analytics/events/stake'
import { Tooltip } from '@mui/material'
import { BRIDGE_EVENTS, BRIDGE_LABELS } from '@/services/analytics/events/bridge'
import { EARN_EVENTS, EARN_LABELS } from '@/services/analytics/events/earn'
import { isNonCriticalUpdate } from '@safe-global/utils/utils/chains'

const getSubdirectory = (pathname: string): string => {
  return pathname.split('/')[1]
}

const geoBlockedRoutes = [AppRoutes.bridge, AppRoutes.swap, AppRoutes.stake, AppRoutes.earn]

const customSidebarEvents: { [key: string]: { event: any; label: string } } = {
  [AppRoutes.bridge]: { event: BRIDGE_EVENTS.OPEN_BRIDGE, label: BRIDGE_LABELS.sidebar },
  [AppRoutes.swap]: { event: SWAP_EVENTS.OPEN_SWAPS, label: SWAP_LABELS.sidebar },
  [AppRoutes.stake]: { event: STAKE_EVENTS.OPEN_STAKE, label: STAKE_LABELS.sidebar },
  [AppRoutes.earn]: { event: EARN_EVENTS.OPEN_EARN_PAGE, label: EARN_LABELS.sidebar },
}

const Navigation = (): ReactElement | null => {
  const chain = useCurrentChain()
  const router = useRouter()
  const { safe } = useSafeInfo()
  const currentSubdirectory = getSubdirectory(router.pathname)
  const queueSize = useQueuedTxsLength()
  const isBlockedCountry = useContext(GeoblockingContext)

  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (isBlockedCountry && geoBlockedRoutes.includes(item.href)) {
        return false
      }

      return isRouteEnabled(item.href, chain)
    })
  }, [chain, isBlockedCountry])

  const enabledNavItems = useMemo(() => {
    return safe.deployed
      ? visibleNavItems
      : visibleNavItems.filter((item) => !UNDEPLOYED_SAFE_BLOCKED_ROUTES.includes(item.href))
  }, [safe.deployed, visibleNavItems])

  if (!router.isReady) {
    return null
  }

  const getBadge = (item: NavItem) => {
    // Indicate whether the current Safe needs an upgrade
    if (item.href === AppRoutes.settings.setup) {
      return (
        safe.implementationVersionState === ImplementationVersionState.OUTDATED && !isNonCriticalUpdate(safe.version)
      )
    }
  }

  // Route Transactions to Queue if there are queued txs, otherwise to History
  const getRoute = (href: string) => {
    if (href === AppRoutes.transactions.history && queueSize) {
      return AppRoutes.transactions.queue
    }
    return href
  }

  const handleNavigationClick = (item: NavItem) => {
    const eventInfo = customSidebarEvents[item.href]
    if (eventInfo) {
      if (item.href === AppRoutes.swap) {
        trackEvent(
          { ...eventInfo.event, label: eventInfo.label },
          { [MixpanelEventParams.ENTRY_POINT]: GA_LABEL_TO_MIXPANEL_PROPERTY[SWAP_LABELS.sidebar] },
        )
      } else {
        trackEvent({ ...eventInfo.event, label: eventInfo.label })
      }
    }

    // Track sidebar click for all navigation items
    trackEvent({ ...OVERVIEW_EVENTS.SIDEBAR_CLICKED }, { [MixpanelEventParams.SIDEBAR_ELEMENT]: item.label })
  }

  return (
    <SidebarList>
      {visibleNavItems.map((item) => {
        const isSelected = !item.externalUrl && currentSubdirectory === getSubdirectory(item.href)
        const isDisabled = item.disabled || !enabledNavItems.includes(item)
        let ItemTag = item.tag ? item.tag : null
        const spaceId = router.query.spaceId
        const query = {
          safe: router.query.safe,
          ...(spaceId && { spaceId }),
        }

        if (item.href === AppRoutes.transactions.history) {
          ItemTag = queueSize ? <SidebarListItemCounter count={queueSize} /> : null
        }

        const shouldPlaceDivider = item.href === AppRoutes.apps.index || item.href === AppRoutes.stake

        return (
          <Tooltip
            title={isDisabled ? 'You need to activate your Safe first.' : ''}
            placement="right"
            key={item.externalUrl || item.href}
            arrow
          >
            <div>
              <ListItemButton
                sx={{ padding: 0 }}
                disabled={isDisabled}
                selected={isSelected}
                onClick={isDisabled ? undefined : () => handleNavigationClick(item)}
                {...(item.externalUrl && {
                  component: 'a',
                  href: item.externalUrl,
                  target: '_blank',
                  rel: 'noopener noreferrer',
                })}
              >
                <SidebarListItemButton
                  selected={isSelected}
                  href={
                    item.href
                      ? {
                          pathname: getRoute(item.href),
                          query,
                        }
                      : undefined
                  }
                  disabled={isDisabled}
                >
                  {item.icon && <SidebarListItemIcon badge={getBadge(item)}>{item.icon}</SidebarListItemIcon>}

                  <SidebarListItemText data-testid="sidebar-list-item" bold>
                    {item.label}

                    {ItemTag}
                  </SidebarListItemText>
                </SidebarListItemButton>
              </ListItemButton>

              {shouldPlaceDivider && <Divider sx={{ mt: 1, mb: 0.5, borderColor: 'background.main' }} />}
            </div>
          </Tooltip>
        )
      })}
    </SidebarList>
  )
}

export default React.memo(Navigation)
