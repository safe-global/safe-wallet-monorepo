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
import type { SafeWorkspaceHeaderProps, SidebarItemConfig, SpaceItem, SidebarVariantContentProps } from '../../types'
import { getQuerySpaceId } from '../../utils'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'

const geoBlockedRoutes = [AppRoutes.bridge, AppRoutes.swap, AppRoutes.stake, AppRoutes.earn]

// When the Safe is inside a space, the top SpaceSafeBar already provides "back to workspace"
// navigation, so the sidebar renders no workspace header. The addToWorkspace header is only for
// Safes that aren't part of a space yet.
const buildWorkspaceHeader = (
  selectedSpace: SpaceItem | undefined,
  spaces: SpaceItem[] | undefined,
  onSpaceAdded: ((space: SpaceItem) => void) | undefined,
): SafeWorkspaceHeaderProps | undefined =>
  selectedSpace ? undefined : { variant: 'addToWorkspace', selectedSpace, spaces, onSpaceAdded }

export const SafeSidebarContent = ({
  selectedSpace,
  spaces,
  onSpaceAdded,
  isLoading = false,
}: SidebarVariantContentProps): ReactElement => {
  const router = useRouter()
  const chain = useCurrentChain()
  const queueSize = useQueuedTxsLength()
  const isBlockedCountry = useContext(GeoblockingContext)
  const { safe } = useSafeInfo()
  const safeAddress = useSafeQueryParam() || undefined

  const getLink = useCallback(
    (item: SidebarItemConfig) => {
      const spaceId = getQuerySpaceId(router.query)
      const query: { spaceId?: string | null; safe?: string } = {
        ...(safeAddress && { safe: safeAddress }),
        ...(spaceId && { spaceId }),
      }

      const pathname =
        item.href === AppRoutes.transactions.history && queueSize ? AppRoutes.transactions.queue : item.href

      return { pathname, query }
    },
    [router.query, safeAddress, queueSize],
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
      return pathname.startsWith(AppRoutes.transactions.index)
    }
    if (item.href === AppRoutes.balances.index) {
      return pathname.startsWith(AppRoutes.balances.index)
    }
    if (item.href === AppRoutes.apps.index) {
      return pathname.startsWith(AppRoutes.apps.index)
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
        const parsedQueueSize = Number(queueSize)
        const badge = !parsedQueueSize ? queueSize : parsedQueueSize

        return { ...item, badge }
      }
      return item
    })
  }, [visibleMainNavigation, queueSize])

  const { mainNavItems, setupGroup } = useResolvedSidebarNav(mainNavWithBadges, visibleDefiGroup, {
    getLink,
    isItemDisabled,
    isItemActive,
  })

  const workspaceHeader = buildWorkspaceHeader(selectedSpace, spaces, onSpaceAdded)

  return (
    <SafeSidebarVariant
      workspaceHeader={workspaceHeader}
      mainNavItems={mainNavItems}
      defiGroup={setupGroup}
      isLoading={isLoading}
    />
  )
}
