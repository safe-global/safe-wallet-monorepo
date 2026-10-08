import type { ReactElement } from 'react'
import { SidebarTopBar } from './SidebarTopBar'
import { getSidebarVariant } from './variants'
import { SidebarCommonFooter } from './SidebarCommonFooter'
import type { SpaceSelectorProps } from '@views/features/spaces/components/Sidebar/types'
import type { SidebarVariantType } from './variants'
import { SidebarView } from '@views/features/spaces/components/Sidebar/SidebarView'

interface SidebarProps extends SpaceSelectorProps {
  type: SidebarVariantType
  isLoading?: boolean
  contained?: boolean
}

export const EnhancedSidebar = ({
  type,
  spaceInitial,
  selectedSpace,
  spaces,
  isLoading = false,
  contained = false,
}: SidebarProps): ReactElement => {
  const Variant = getSidebarVariant(type)
  return (
    <SidebarView
      contained={contained}
      topBar={<SidebarTopBar />}
      variant={
        <Variant spaceInitial={spaceInitial} selectedSpace={selectedSpace} spaces={spaces} isLoading={isLoading} />
      }
      footer={<SidebarCommonFooter isSafeSidebar={type === 'safe'} />}
    />
  )
}
