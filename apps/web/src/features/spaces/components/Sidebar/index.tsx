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
  contained?: boolean
}

const SIDEBAR_CONTAINER_CLASSNAME = '!p-0 border-r-0 group-data-[side=left]:border-r-0'
const SIDEBAR_INNER_CLASSNAME = 'rounded-[0_8px_8px_0] group-data-[variant=floating]:rounded-[0_8px_8px_0] shadow-none'

export const EnhancedSidebar = ({
  type,
  spaceInitial,
  selectedSpace,
  spaces,
  onSpaceAdded,
  isLoading = false,
  contained = false,
}: SidebarProps): ReactElement => {
  const Variant = getSidebarVariant(type)
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      contained={contained}
      containerClassName={SIDEBAR_CONTAINER_CLASSNAME}
      innerClassName={SIDEBAR_INNER_CLASSNAME}
      data-testid="sidebar-container"
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
