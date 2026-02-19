import type { ReactElement } from 'react'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useIsActiceMember } from '@/features/spaces/hooks/useSpaceMembers'
import { spacesMainNavigation, spacesSetupGroup } from '../config'
import { useResolvedSidebarNav } from '../hooks/useResolvedSidebarNav'
import type { SpaceSelectorProps, SidebarItemConfig } from '../types'
import { SpacesSidebarVariant } from './SpacesSidebarVariant'

export const SpacesSidebarContent = ({ selectedSpace, spaces, spaceName, spaceInitial }: SpaceSelectorProps): ReactElement => {
  const spaceId = useCurrentSpaceId()
  const isActiveMember = useIsActiceMember(selectedSpace?.id)

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
      spaceName={spaceName}
      spaceInitial={spaceInitial}
    />
  )
}
