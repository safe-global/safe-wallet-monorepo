import type { ReactElement } from 'react'
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar'
import { SidebarTopBar } from './SidebarTopBar'
import { getSidebarVariant } from './variants'
import { SidebarCommonFooter } from './SidebarCommonFooter'
import { SidebarProfileSection } from './SidebarProfileSection'
import type { SpaceSelectorProps } from './types'
import type { SidebarVariantType } from './variants'

interface SidebarProps extends SpaceSelectorProps {
  type: SidebarVariantType
  isLoading?: boolean
}

export const EnhancedSidebar = ({
  type,
  spaceInitial,
  selectedSpace,
  spaces,
  onSpaceAdded,
  isLoading = false,
}: SidebarProps): ReactElement => {
  const Variant = getSidebarVariant(type)
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="!p-0 border-r-0 group-data-[side=left]:border-r-0 [&_[data-slot=sidebar-inner]]:rounded-none [&_[data-slot=sidebar-inner]]:rounded-tr-[8px] [&_[data-slot=sidebar-inner]]:rounded-br-[8px] [&_[data-slot=sidebar-inner]]:shadow-none"
    >
      <SidebarHeader>
        <SidebarTopBar />
      </SidebarHeader>

      <Variant
        spaceInitial={spaceInitial}
        selectedSpace={selectedSpace}
        spaces={spaces}
        onSpaceAdded={onSpaceAdded}
        isLoading={isLoading}
      />
      <SidebarCommonFooter isSafeSidebar={type === 'safe'} />
      <SidebarProfileSection />
    </Sidebar>
  )
}
