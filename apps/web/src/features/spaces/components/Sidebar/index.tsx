import type { ReactElement } from 'react'
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar'
import { SidebarTopBar } from './SidebarTopBar'
import { getSidebarVariant } from './variants'
import { SidebarCommonFooter } from './SidebarCommonFooter'
import type { SpaceSelectorProps } from './types'
import type { SidebarVariantType } from './variants'

interface SidebarProps extends SpaceSelectorProps {
  type: SidebarVariantType
}

export const EnhancedSidebar = ({ type, spaceName, spaceInitial }: SidebarProps): ReactElement => {
  const Variant = getSidebarVariant(type)
  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarTopBar />
      </SidebarHeader>

      <Variant spaceName={spaceName} spaceInitial={spaceInitial} />
      <SidebarCommonFooter />
    </Sidebar>
  )
}
