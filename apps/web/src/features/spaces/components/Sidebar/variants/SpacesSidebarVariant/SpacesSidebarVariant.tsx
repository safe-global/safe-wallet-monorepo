import type { ReactElement } from 'react'
import type {
  SpaceSelectorProps,
  ResolvedSidebarNavItem,
  ResolvedSidebarGroup,
} from '@views/features/spaces/components/Sidebar/types'
import { NavItem } from '../NavItem'
import { SidebarDeveloperGroup } from '../SidebarDeveloperGroup'
import { SpaceSelectorDropdown } from '../SpaceSelectorDropdown'
import { SpacesSidebarVariantView } from '@views/features/spaces/components/Sidebar/variants/SpacesSidebarVariant/SpacesSidebarVariantView'

interface SpacesSidebarVariantProps extends SpaceSelectorProps {
  mainNavItems: ResolvedSidebarNavItem[] | null
  setupGroup: ResolvedSidebarGroup | null
  isLoading?: boolean
}

const SPACES_MAIN_NAV_SKELETON_COUNT = 3
const SPACES_SETUP_GROUP_SKELETON_COUNT = 2

export const SpacesSidebarVariant = ({
  selectedSpace,
  spaces,
  mainNavItems,
  setupGroup,
  isLoading = false,
}: SpacesSidebarVariantProps): ReactElement => {
  const displayMainNavItems = mainNavItems || Array(SPACES_MAIN_NAV_SKELETON_COUNT).fill(null)
  const displaySetupItems = setupGroup?.items || Array(SPACES_SETUP_GROUP_SKELETON_COUNT).fill(null)

  return (
    <SpacesSidebarVariantView
      spaceSelector={<SpaceSelectorDropdown selectedSpace={selectedSpace} spaces={spaces} />}
      mainNavItems={displayMainNavItems.map((item, index) => (
        <NavItem key={item?.href ?? `skeleton-main-${index}`} item={item} isSpacesVariant isLoading={isLoading} />
      ))}
      setupGroupLabel={setupGroup?.label ?? ''}
      setupItems={displaySetupItems.map((item, index) => (
        <NavItem key={item?.href ?? `skeleton-setup-${index}`} item={item} isSpacesVariant isLoading={isLoading} />
      ))}
      developerGroup={<SidebarDeveloperGroup isLoading={isLoading} />}
    />
  )
}
