import type { ReactElement } from 'react'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useIsActiveMember } from '@/features/spaces/hooks/useSpaceMembers'
import { spacesMainNavigation, spacesSetupGroup } from '../../config'
import { useResolvedSidebarNav } from '../../hooks/useResolvedSidebarNav'
import type { SidebarItemConfig, SidebarVariantContentProps } from '../../types'
import { SpacesSidebarVariant } from '../SpacesSidebarVariant'

export const SpacesSidebarContent = ({
  selectedSpace,
  spaces,
  spaceInitial,
  isLoading = false,
}: SidebarVariantContentProps): ReactElement => {
  const spaceId = useCurrentSpaceId()
  const isActiveMember = useIsActiveMember(selectedSpace?.id)

  const getLink = (item: SidebarItemConfig) => ({
    pathname: item.href,
    query: { spaceId },
  })

  const isItemDisabled = (item: SidebarItemConfig) => !!item.activeMemberOnly && !isActiveMember

  const { mainNavItems, setupGroup } = useResolvedSidebarNav(spacesMainNavigation, spacesSetupGroup, {
    getLink,
    isItemDisabled,
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
