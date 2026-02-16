import type { ReactElement } from 'react'
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar'
import { SidebarTopBar } from './SidebarTopBar'
import { SidebarMapper } from './SidebarMapper'
import { SidebarCommonFooter } from './SidebarCommonFooter'
import type { SpaceSelectorProps } from './types'

interface EnhancedSidebarProps extends SpaceSelectorProps {
  isSpacesRoute?: boolean
}

export const EnhancedSidebar = ({
  isSpacesRoute = false,
  spaceName,
  spaceInitial,
}: EnhancedSidebarProps): ReactElement => {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarTopBar />
      </SidebarHeader>

      <SidebarMapper isSpacesRoute={isSpacesRoute} spaceName={spaceName} spaceInitial={spaceInitial} />
      <SidebarCommonFooter />
    </Sidebar>
  )
}
