import { type ReactElement, useMemo } from 'react'
import { useCurrentSpaceId } from '../../../../hooks/useCurrentSpaceId'
import { useIsActiveMember } from '../../../../hooks/useSpaceMembers'
import { spacesMainNavigation, spacesSetupGroup } from '../../config'
import { useResolvedSidebarNav } from '../../hooks/useResolvedSidebarNav'
import type { SidebarItemConfig, SidebarVariantContentProps } from '../../types'
import { SpacesSidebarVariant } from '../SpacesSidebarVariant'
import { useHasFeature } from '@/hooks/useChains'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useIsSafeProAnnouncementEnabled } from '@/features/safe-pro-announcement'
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
  const isPoliciesEnabled = useHasFeature(FEATURES.POLICIES)
  const isAnnounced = useIsSafeProAnnouncementEnabled()
  const isSafePro = useIsSafeProEnabled() === true

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

  // Drop flag-gated entries when their chain feature flag is explicitly off. `undefined` means
  // the chain config is still loading — keep the item to avoid flicker. Plans is the inverse: it shows
  // only once either Safe Pro flag is known to be on, so a slow chain config can't flash it in and out.
  const gatedOffHrefs = useMemo(
    () =>
      new Set(
        (
          [
            [AppRoutes.spaces.security, isSecurityHubEnabled],
            [AppRoutes.spaces.activity, isAuditLogEnabled],
            [AppRoutes.spaces.policies, isPoliciesEnabled],
            [AppRoutes.spaces.plans, isAnnounced || isSafePro],
          ] as const
        )
          .filter(([, isEnabled]) => isEnabled === false)
          .map(([href]) => href),
      ),
    [isSecurityHubEnabled, isAuditLogEnabled, isPoliciesEnabled, isAnnounced, isSafePro],
  )

  const filteredSetupGroup = useMemo(
    () => ({
      ...spacesSetupGroup,
      items: spacesSetupGroup.items.filter((i) => !gatedOffHrefs.has(i.href)),
    }),
    [gatedOffHrefs],
  )

  const filteredMainNavigation = useMemo(
    () => spacesMainNavigation.filter((i) => !gatedOffHrefs.has(i.href)),
    [gatedOffHrefs],
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
