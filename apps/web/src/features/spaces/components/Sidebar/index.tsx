import { useEffect, type ReactElement } from 'react'
import { Sidebar, SidebarHeader } from '@safe-global/views/components/ui/sidebar'
import { SidebarTopBar } from './SidebarTopBar'
import { UnifiedTopBar } from './unified/UnifiedTopBar'
import { getSidebarVariant } from './variants'
import { SidebarCommonFooter } from './SidebarCommonFooter'
import type { SpaceSelectorProps } from '@safe-global/views/features/spaces/components/Sidebar/types'
import type { SidebarVariantType } from './variants'
import { UnifiedSidebarContent } from './unified/UnifiedSidebarContent'
import { ScenarioBar } from './unified/ScenarioBar'
import { syncSwitchFromUrl, useIsPrototypeOn } from './unified/scenario'

interface SidebarProps extends SpaceSelectorProps {
  type: SidebarVariantType
  isLoading?: boolean
  contained?: boolean
}

const SIDEBAR_CONTAINER_CLASSNAME = '!p-0 border-r-0 group-data-[side=left]:border-r-0'
// No divider between the sidebar and the content: the panel is delimited by its own surface colour
// (--sidebar: white in light, #121312 in dark) against the page background. `ring-0` still cancels
// the floating variant's ring in ui/sidebar.tsx so no edge comes back that way. Radius is dev's 12px.
const SIDEBAR_INNER_CLASSNAME =
  'rounded-[0_12px_12px_0] group-data-[variant=floating]:rounded-[0_12px_12px_0] shadow-none group-data-[variant=floating]:ring-0'

export const EnhancedSidebar = ({
  type,
  spaceInitial,
  selectedSpace,
  spaces,
  isLoading = false,
  contained = false,
}: SidebarProps): ReactElement => {
  useEffect(() => syncSwitchFromUrl(window.location.search), [])
  // Design prototype, off in production builds: `?proto=sidebar` swaps the Safe sidebar for the unified one.
  const isUnified = useIsPrototypeOn() && type === 'safe'
  const Variant = isUnified ? UnifiedSidebarContent : getSidebarVariant(type)
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      contained={contained}
      containerClassName={SIDEBAR_CONTAINER_CLASSNAME}
      innerClassName={SIDEBAR_INNER_CLASSNAME}
      data-testid="sidebar-container"
    >
      <SidebarHeader>{isUnified ? <UnifiedTopBar /> : <SidebarTopBar />}</SidebarHeader>

      <Variant spaceInitial={spaceInitial} selectedSpace={selectedSpace} spaces={spaces} isLoading={isLoading} />
      <SidebarCommonFooter isSafeSidebar={type === 'safe'} />
      {isUnified && <ScenarioBar />}
    </Sidebar>
  )
}
