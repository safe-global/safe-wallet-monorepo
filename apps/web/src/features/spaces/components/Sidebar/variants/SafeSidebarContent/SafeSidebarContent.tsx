import type { ReactElement } from 'react'
import { useCallback, useContext, useMemo } from 'react'
import { safeMainNavigation, safeDefiGroup } from '../../config'
import { useResolvedSidebarNav } from '../../hooks/useResolvedSidebarNav'
import { SafeSidebarVariant } from '../SafeSidebarVariant/SafeSidebarVariant'
import { useQueuedTxsLength } from '@/hooks/useTxQueue'
import { AppRoutes, UNDEPLOYED_SAFE_BLOCKED_ROUTES } from '@/config/routes'
import { useCurrentChain } from '@/hooks/useChains'
import { isRouteEnabled } from '@/utils/chains'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import type {
  SafeWorkspaceHeaderProps,
  SidebarItemConfig,
  SpaceItem,
  SidebarVariantContentProps,
} from '@safe-global/views/features/spaces/components/Sidebar/types'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'
// eslint-disable-next-line no-restricted-imports -- prototype only, not for merge
import { useDefiV1 } from '@/features/earn/defiV1/context'

const geoBlockedRoutes = [AppRoutes.bridge, AppRoutes.swap, AppRoutes.stake, AppRoutes.earn]

const buildWorkspaceHeader = (
  selectedSpace: SpaceItem | undefined,
  spaceInitial: string | undefined,
  spaces: SpaceItem[] | undefined,
): SafeWorkspaceHeaderProps =>
  selectedSpace
    ? { variant: 'backToSpace', spaceName: selectedSpace.name, spaceInitial, spaceId: selectedSpace.uuid }
    : { variant: 'addToWorkspace', selectedSpace, spaces }

export const SafeSidebarContent = ({
  selectedSpace,
  spaces,
  spaceInitial,
  isLoading = false,
}: SidebarVariantContentProps): ReactElement => {
  const chain = useCurrentChain()
  const queueSize = useQueuedTxsLength()
  const isBlockedCountry = useContext(GeoblockingContext)
  const { safe } = useSafeInfo()
  const safeAddress = useSafeQueryParam() || undefined
  const spaceId = useUrlSpaceId()

  const getLink = useCallback(
    (item: SidebarItemConfig) => {
      const query = withSpaceId(safeAddress ? { safe: safeAddress } : {}, spaceId)

      const pathname =
        item.href === AppRoutes.transactions.history && queueSize ? AppRoutes.transactions.queue : item.href

      return { pathname, query }
    },
    [spaceId, safeAddress, queueSize],
  )

  const defiV1 = useDefiV1()
  const earnLabel = defiV1 ? (defiV1.framing === 'treasury' ? 'Treasury' : 'DeFi') : undefined

  const isItemDisabled = useCallback(
    (item: SidebarItemConfig) => {
      if (isBlockedCountry && geoBlockedRoutes.includes(item.href)) return true
      if (!safe.deployed && UNDEPLOYED_SAFE_BLOCKED_ROUTES.includes(item.href)) return true
      if (earnLabel && item.href === AppRoutes.earn)
        return !isRouteEnabled(AppRoutes.stake, chain) && !isRouteEnabled(item.href, chain)
      return !isRouteEnabled(item.href, chain)
    },
    [isBlockedCountry, safe.deployed, chain, earnLabel],
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
    const items = safeMainNavigation.filter((item) => {
      if (isBlockedCountry && geoBlockedRoutes.includes(item.href)) return false
      return isRouteEnabled(item.href, chain)
    })
    const earn = safeDefiGroup.items.find((item) => item.href === AppRoutes.earn)
    const hasYield = isRouteEnabled(AppRoutes.earn, chain) || isRouteEnabled(AppRoutes.stake, chain)
    if (!earnLabel || !earn || !hasYield || isBlockedCountry) return items
    const after = items.findIndex((item) => item.href === AppRoutes.transactions.history) + 1
    return [...items.slice(0, after), { ...earn, label: earnLabel }, ...items.slice(after)]
  }, [chain, isBlockedCountry, earnLabel])

  const visibleDefiGroup = useMemo(() => {
    const filteredItems = safeDefiGroup.items.filter((item) => {
      if (earnLabel && (item.href === AppRoutes.earn || item.href === AppRoutes.stake)) return false
      if (isBlockedCountry && geoBlockedRoutes.includes(item.href)) return false
      return isRouteEnabled(item.href, chain)
    })
    return { ...safeDefiGroup, label: earnLabel ? 'Trade' : safeDefiGroup.label, items: filteredItems }
  }, [chain, isBlockedCountry, earnLabel])
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

  const workspaceHeader = buildWorkspaceHeader(selectedSpace, spaceInitial, spaces)

  return (
    <SafeSidebarVariant
      workspaceHeader={workspaceHeader}
      mainNavItems={mainNavItems}
      defiGroup={setupGroup}
      isLoading={isLoading}
    />
  )
}
