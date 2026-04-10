import type { ReactElement } from 'react'
import { useCallback, useContext, useMemo } from 'react'
import { useRouter } from 'next/router'
import { safeMainNavigation, safeDefiGroup } from '../../config'
import { useResolvedSidebarNav } from '../../hooks/useResolvedSidebarNav'
import { SafeSidebarVariant } from '../SafeSidebarVariant'
import { useQueuedTxsLength } from '@/hooks/useTxQueue'
import { AppRoutes, UNDEPLOYED_SAFE_BLOCKED_ROUTES } from '@/config/routes'
import { useCurrentChain } from '@/hooks/useChains'
import { isRouteEnabled } from '@/utils/chains'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type { SafeWorkspaceHeaderProps, SpaceSelectorProps, SidebarItemConfig, SpaceItem } from '../../types'
import { getQuerySpaceId } from '../../utils'

const geoBlockedRoutes = [AppRoutes.bridge, AppRoutes.swap, AppRoutes.stake, AppRoutes.earn]

const buildWorkspaceHeader = (
  selectedSpace: SpaceItem | undefined,
  spaceName: string | undefined,
  spaceInitial: string | undefined,
  spaces: SpaceItem[] | undefined,
  onSpaceAdded: ((space: SpaceItem) => void) | undefined,
): SafeWorkspaceHeaderProps =>
  selectedSpace
    ? { variant: 'backToSpace', spaceName: spaceName ?? '', spaceInitial, spaceId: String(selectedSpace.id) }
    : { variant: 'addToWorkspace', selectedSpace, spaces, onSpaceAdded }

export const SafeSidebarContent = ({
  selectedSpace,
  spaces,
  spaceName,
  spaceInitial,
  onSpaceAdded,
}: SpaceSelectorProps): ReactElement => {
  const router = useRouter()
  const chain = useCurrentChain()
  const queueSize = useQueuedTxsLength()
  const isBlockedCountry = useContext(GeoblockingContext)
  const { safe } = useSafeInfo()

  const getLink = useCallback(
    (item: SidebarItemConfig) => {
      const spaceId = getQuerySpaceId(router.query)
      const safeAddress = typeof router.query.safe === 'string' ? router.query.safe : undefined
      const query: { spaceId?: string | null; safe?: string } = {
        ...(safeAddress && { safe: safeAddress }),
        ...(spaceId && { spaceId }),
      }

      // Route Transactions to Queue if there are queued txs
      const href =
        item.href === AppRoutes.transactions.history && Number(queueSize) > 0 ? AppRoutes.transactions.queue : item.href

      return { pathname: href, query }
    },
    [router.query, queueSize],
  )

  const isItemDisabled = useCallback(
    (item: SidebarItemConfig) => {
      if (isBlockedCountry && geoBlockedRoutes.includes(item.href)) return true
      if (!safe.deployed && UNDEPLOYED_SAFE_BLOCKED_ROUTES.includes(item.href)) return true
      return !isRouteEnabled(item.href, chain)
    },
    [isBlockedCountry, safe.deployed, chain],
  )

  const isItemActive = useCallback((item: SidebarItemConfig, pathname: string) => {
    if (item.href === AppRoutes.transactions.history) {
      return pathname === AppRoutes.transactions.history || pathname === AppRoutes.transactions.queue
    }
    return pathname === item.href
  }, [])

  // Filter visible items by geoblocking and chain features
  const visibleMainNavigation = useMemo(() => {
    return safeMainNavigation.filter((item) => {
      if (isBlockedCountry && geoBlockedRoutes.includes(item.href)) return false
      return isRouteEnabled(item.href, chain)
    })
  }, [chain, isBlockedCountry])

  const visibleDefiGroup = useMemo(() => {
    const filteredItems = safeDefiGroup.items.filter((item) => {
      if (isBlockedCountry && geoBlockedRoutes.includes(item.href)) return false
      return isRouteEnabled(item.href, chain)
    })
    return { ...safeDefiGroup, items: filteredItems }
  }, [chain, isBlockedCountry])

  // tx queue badge
  const mainNavWithBadges = useMemo(() => {
    return visibleMainNavigation.map((item) => {
      if (item.href === AppRoutes.transactions.history) {
        return { ...item, badge: Number(queueSize) }
      }
      return item
    })
  }, [visibleMainNavigation, queueSize])

  const { mainNavItems, setupGroup } = useResolvedSidebarNav(mainNavWithBadges, visibleDefiGroup, {
    getLink,
    isItemDisabled,
    isItemActive,
  })

  const workspaceHeader = buildWorkspaceHeader(selectedSpace, spaceName, spaceInitial, spaces, onSpaceAdded)

  return <SafeSidebarVariant workspaceHeader={workspaceHeader} mainNavItems={mainNavItems} defiGroup={setupGroup} />
}
