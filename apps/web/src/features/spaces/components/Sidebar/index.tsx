import type { ReactElement } from 'react'
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar'
import { SidebarTopBar } from './SidebarTopBar'
import { SidebarMapper } from './SidebarMapper'
import { SidebarCommonFooter } from './SidebarCommonFooter'

interface EnhancedSidebarProps {
  isSpacesRoute?: boolean
}

export const EnhancedSidebar = ({ isSpacesRoute = false }: EnhancedSidebarProps): ReactElement => {
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarTopBar />
      </SidebarHeader>

      <SidebarMapper isSpacesRoute={isSpacesRoute} />

      <SidebarCommonFooter />
    </Sidebar>
  )
}
