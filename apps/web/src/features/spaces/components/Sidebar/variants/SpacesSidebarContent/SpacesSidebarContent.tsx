import { type ReactElement, useMemo } from 'react'
import { useCurrentSpaceId } from '../../../../hooks/useCurrentSpaceId'
import { useIsActiveMember } from '../../../../hooks/useSpaceMembers'
import { spacesMainNavigation, spacesSetupGroup } from '../../config'
import { useResolvedSidebarNav } from '../../hooks/useResolvedSidebarNav'
import type { SidebarItemConfig, SidebarVariantContentProps } from '../../types'
import { SpacesSidebarVariant } from '../SpacesSidebarVariant'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'

export const SpacesSidebarContent = ({
  selectedSpace,
  spaces,
  spaceInitial,
  isLoading = false,
}: SidebarVariantContentProps): ReactElement => {
  const spaceId = useCurrentSpaceId()
  const isActiveMember = useIsActiveMember(selectedSpace?.uuid)
  const isSecurityHubEnabled = useHasFeature(FEATURES.SECURITY_HUB)
  const isAuditLogEnabled = useHasFeature(FEATURES.SPACE_AUDIT_LOG)
  const isSafeProEnabled = useHasFeature(FEATURES.SAFE_PRO)

  const getLink = (item: SidebarItemConfig) => ({
    pathname: item.href,
    query: { spaceId },
  })

  const isItemDisabled = (item: SidebarItemConfig) => !!item.activeMemberOnly && !isActiveMember

  // Match the item when the URL is the item's href or one of its sub-routes
  // (e.g. /spaces/settings/general should highlight the Settings nav item).
  // The spaces index (/spaces) is exact-match only — otherwise every space
  // sub-route would also highlight Home.
  const isItemActive = (item: SidebarItemConfig, pathname: string) => {
    if (item.href === AppRoutes.spaces.index) return pathname === item.href
    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  // Security hides only when its flag is explicitly off (`undefined` means the chain config is
  // still loading, and keeping the item avoids flicker); Plans is the inverse — it appears only
  // once SAFE_PRO is known to be on, so a slow chain config can't flash an entry in and out.
  const filteredSetupGroup = useMemo(() => {
    const hiddenHrefs = [
      isSecurityHubEnabled === false && AppRoutes.spaces.security,
      !isSafeProEnabled && AppRoutes.spaces.plans,
    ]

    return { ...spacesSetupGroup, items: spacesSetupGroup.items.filter((i) => !hiddenHrefs.includes(i.href)) }
  }, [isSecurityHubEnabled, isSafeProEnabled])

  // Same anti-flicker rule for the Activity entry (SPACE_AUDIT_LOG flag).
  const filteredMainNavigation = useMemo(
    () =>
      isAuditLogEnabled === false
        ? spacesMainNavigation.filter((i) => i.href !== AppRoutes.spaces.activity)
        : spacesMainNavigation,
    [isAuditLogEnabled],
  )

  const { mainNavItems, setupGroup } = useResolvedSidebarNav(filteredMainNavigation, filteredSetupGroup, {
    getLink,
    isItemDisabled,
    isItemActive,
  })

  return (
    <SpacesSidebarVariant
      mainNavItems={mainNavItems}
      setupGroup={setupGroup}
      selectedSpace={selectedSpace}
      spaces={spaces}
      spaceInitial={spaceInitial}
      isLoading={isLoading}
    />
  )
}
