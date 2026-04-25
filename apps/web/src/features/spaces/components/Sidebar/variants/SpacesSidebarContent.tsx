import { type ReactElement, useMemo } from 'react'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useIsActiveMember } from '@/features/spaces/hooks/useSpaceMembers'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { spacesMainNavigation, spacesSetupGroup } from '../config'
import { useResolvedSidebarNav } from '../hooks/useResolvedSidebarNav'
import type { SpaceSelectorProps, SidebarItemConfig } from '../types'
import { SpacesSidebarVariant } from './SpacesSidebarVariant'

export const SpacesSidebarContent = ({
  selectedSpace,
  spaces,
  spaceName,
  spaceInitial,
}: SpaceSelectorProps): ReactElement => {
  const spaceId = useCurrentSpaceId()
  const isActiveMember = useIsActiveMember(selectedSpace?.id)
  const isSecurityHubEnabled = useHasFeature(FEATURES.SECURITY_HUB)

  const getLink = (item: SidebarItemConfig) => ({
    pathname: item.href,
    query: { spaceId },
  })

  const isItemDisabled = (item: SidebarItemConfig) => !!item.activeMemberOnly && !isActiveMember

  // Drop the Security entry from the Setup group when the chain feature flag is explicitly
  // off. `undefined` means the chain config is still loading — keep the item to avoid flicker.
  const filteredSetupGroup = useMemo(
    () =>
      isSecurityHubEnabled === false
        ? { ...spacesSetupGroup, items: spacesSetupGroup.items.filter((i) => i.href !== AppRoutes.spaces.security) }
        : spacesSetupGroup,
    [isSecurityHubEnabled],
  )

  const { mainNavItems, setupGroup } = useResolvedSidebarNav(spacesMainNavigation, filteredSetupGroup, {
    getLink,
    isItemDisabled,
  })

  return (
    <SpacesSidebarVariant
      mainNavItems={mainNavItems}
      setupGroup={setupGroup}
      selectedSpace={selectedSpace}
      spaces={spaces}
      spaceName={spaceName}
      spaceInitial={spaceInitial}
    />
  )
}
