import React, { useContext, useMemo, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { ListItemButton } from '@mui/material'
import { ImplementationVersionState } from '@safe-global/safe-gateway-typescript-sdk'

import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemCounter,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import { type NavItem, navItems } from './config'
import useSafeInfo from '@/hooks/useSafeInfo'
import { AppRoutes } from '@/config/routes'
import { useQueuedTxsLength } from '@/hooks/useTxQueue'
import { useCurrentChain } from '@/hooks/useChains'
import { isRouteEnabled } from '@/utils/chains'
import { trackEvent } from '@/services/analytics'
import { SWAP_EVENTS, SWAP_LABELS } from '@/services/analytics/events/swaps'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { STAKE_EVENTS, STAKE_LABELS } from '@/services/analytics/events/stake'
import { Tooltip } from '@mui/material'
import { BRIDGE_EVENTS, BRIDGE_LABELS } from '@/services/analytics/events/bridge'

const getSubdirectory = (pathname: string): string => {
  return pathname.split('/')[1]
}

const geoBlockedRoutes = [AppRoutes.bridge, AppRoutes.swap, AppRoutes.stake]

const undeployedSafeBlockedRoutes = [AppRoutes.bridge, AppRoutes.swap, AppRoutes.stake, AppRoutes.apps.index]

const customSidebarEvents: { [key: string]: { event: any; label: string } } = {
  [AppRoutes.bridge]: { event: BRIDGE_EVENTS.OPEN_BRIDGE, label: BRIDGE_LABELS.sidebar },
  [AppRoutes.swap]: { event: SWAP_EVENTS.OPEN_SWAPS, label: SWAP_LABELS.sidebar },
  [AppRoutes.stake]: { event: STAKE_EVENTS.OPEN_STAKE, label: STAKE_LABELS.sidebar },
}

const Navigation = (): ReactElement => {
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
      : visibleNavItems.filter((item) => !undeployedSafeBlockedRoutes.includes(item.href))
  }, [safe.deployed, visibleNavItems])

  const getBadge = (item: NavItem) => {
    // Indicate whether the current Safe needs an upgrade
    if (item.href === AppRoutes.settings.setup) {
      return safe.implementationVersionState === ImplementationVersionState.OUTDATED
    }
  }

  // Route Transactions to Queue if there are queued txs, otherwise to History
  const getRoute = (href: string) => {
    if (href === AppRoutes.transactions.history && queueSize) {
      return AppRoutes.transactions.queue
    }
    return href
  }

  const handleNavigationClick = (href: string) => {
    const eventInfo = customSidebarEvents[href]
    if (eventInfo) {
      trackEvent({ ...eventInfo.event, label: eventInfo.label })
    }
  }

  return (
    <SidebarList>
      {visibleNavItems.map((item) => {
        const isSelected = currentSubdirectory === getSubdirectory(item.href)
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

        return (
          <Tooltip
            title={isDisabled ? 'You need to activate your Safe first.' : ''}
            placement="right"
            key={item.href}
            arrow
          >
            <div>
              <ListItemButton
                // disablePadding
                sx={{ padding: 0 }}
                disabled={isDisabled}
                selected={isSelected}
                onClick={isDisabled ? undefined : () => handleNavigationClick(item.href)}
                key={item.href}
              >
                <SidebarListItemButton
                  selected={isSelected}
                  href={
                    item.href && {
                      pathname: getRoute(item.href),
                      query,
                    }
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
            </div>
          </Tooltip>
        )
      })}
    </SidebarList>
  )
}

export default React.memo(Navigation)
