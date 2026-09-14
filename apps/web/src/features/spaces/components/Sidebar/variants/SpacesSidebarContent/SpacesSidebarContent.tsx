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
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import { useSpacePlan } from '../../../../hooks/useSpacePlan'

// The menu button forces every svg to 16px and the active state strokes it; the chip is a 24x16 fill-only lockup.
const PlansProChip = () => (
  <span className="block h-4 w-6 shrink-0 [&_svg]:size-full! [&_svg]:stroke-none!" data-testid="plans-pro-chip">
    <ProChip />
  </span>
)

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
  const isSafeProEnabled = useHasFeature(FEATURES.SAFE_PRO_ANNOUNCEMENT)
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const { isPaidActive } = useSpacePlan(selectedSpace?.uuid)
  const hasPlansUpsell = isSafePro && !isPaidActive

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
  // the chain config is still loading — keep the item to avoid flicker. Plans is the inverse: it
  // shows only once SAFE_PRO_ANNOUNCEMENT is known to be on, so a slow chain config can't flash it in and out.
  const gatedOffHrefs = useMemo(
    () =>
      new Set(
        (
          [
            [AppRoutes.spaces.security, isSecurityHubEnabled],
            [AppRoutes.spaces.activity, isAuditLogEnabled],
            [AppRoutes.spaces.policies, isPoliciesEnabled],
            [AppRoutes.spaces.plans, !!isSafeProEnabled],
          ] as const
        )
          .filter(([, isEnabled]) => isEnabled === false)
          .map(([href]) => href),
      ),
    [isSecurityHubEnabled, isAuditLogEnabled, isPoliciesEnabled, isSafeProEnabled],
  )

  const filteredSetupGroup = useMemo(
    () => ({
      ...spacesSetupGroup,
      items: spacesSetupGroup.items
        .filter((i) => !gatedOffHrefs.has(i.href))
        .map((i) => (hasPlansUpsell && i.href === AppRoutes.spaces.plans ? { ...i, icon: PlansProChip } : i)),
    }),
    [gatedOffHrefs, hasPlansUpsell],
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
