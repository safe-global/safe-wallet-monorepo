import type { ReactElement } from 'react'
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar'
import { SidebarTopBar } from './SidebarTopBar'
import { getSidebarVariant } from './variants'
import { SidebarCommonFooter } from './SidebarCommonFooter'
import type { SpaceSelectorProps } from './types'
import type { SidebarVariantType } from './variants'
import css from './styles.module.css'

interface SidebarProps extends SpaceSelectorProps {
  type: SidebarVariantType
}

export const EnhancedSidebar = ({
  type,
  spaceName,
  spaceInitial,
  selectedSpace,
  spaces,
}: SidebarProps): ReactElement => {
  const Variant = getSidebarVariant(type)
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="!p-0 border-r-0 group-data-[side=left]:border-r-0 [&_[data-slot=sidebar-inner]]:rounded-none [&_[data-slot=sidebar-inner]]:rounded-tr-[8px] [&_[data-slot=sidebar-inner]]:rounded-br-[8px] [&_[data-slot=sidebar-inner]]:shadow-[0_2px_8px_rgba(23,23,23,0.06)]"
    >
      <SidebarHeader className={css.sidebarHeader}>
        <SidebarTopBar />
      </SidebarHeader>

      <Variant spaceName={spaceName} spaceInitial={spaceInitial} selectedSpace={selectedSpace} spaces={spaces} />
      <SidebarCommonFooter isSafeSidebar={type === 'safe'} />
    </Sidebar>
  )
}
