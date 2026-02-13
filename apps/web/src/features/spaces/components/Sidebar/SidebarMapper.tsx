import type { ReactElement } from 'react'
import { SpacesSidebarWrapper } from './SpacesSidebarWrapper'
import { SafeSidebarWrapper } from './SafeSidebarWrapper'

interface SidebarMapperProps {
  isSpacesRoute?: boolean
}

export const SidebarMapper = ({ isSpacesRoute = false }: SidebarMapperProps): ReactElement => {
  return isSpacesRoute ? <SpacesSidebarWrapper /> : <SafeSidebarWrapper />
}
