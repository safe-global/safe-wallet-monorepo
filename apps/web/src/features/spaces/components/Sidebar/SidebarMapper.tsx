import type { ReactElement } from 'react'
import { SpacesSidebarWrapper } from './SpacesSidebarWrapper'
import { SafeSidebarWrapper } from './SafeSidebarWrapper'
import type { SpaceSelectorProps } from './types'

interface SidebarMapperProps extends SpaceSelectorProps {
  isSpacesRoute?: boolean
}

export const SidebarMapper = ({ isSpacesRoute = false, spaceName, spaceInitial }: SidebarMapperProps): ReactElement => {
  const spaceSelectorProps = { spaceName, spaceInitial }
  return isSpacesRoute ? (
    <SpacesSidebarWrapper {...spaceSelectorProps} />
  ) : (
    <SafeSidebarWrapper {...spaceSelectorProps} />
  )
}
