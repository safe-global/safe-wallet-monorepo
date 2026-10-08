import type { ReactElement, ReactNode } from 'react'
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar'

const SIDEBAR_CONTAINER_CLASSNAME = '!p-0 border-r-0 group-data-[side=left]:border-r-0'
// No divider between the sidebar and the content: the panel is delimited by its own surface colour
// (--sidebar: white in light, #121312 in dark) against the page background. `ring-0` still cancels
// the floating variant's ring in ui/sidebar.tsx so no edge comes back that way. Radius is dev's 12px.
const SIDEBAR_INNER_CLASSNAME =
  'rounded-[0_12px_12px_0] group-data-[variant=floating]:rounded-[0_12px_12px_0] shadow-none group-data-[variant=floating]:ring-0'

export type SidebarViewProps = {
  contained: boolean
  topBar: ReactNode
  variant: ReactNode
  footer: ReactNode
}

export const SidebarView = ({ contained, topBar, variant, footer }: SidebarViewProps): ReactElement => (
  <Sidebar
    collapsible="icon"
    variant="floating"
    contained={contained}
    containerClassName={SIDEBAR_CONTAINER_CLASSNAME}
    innerClassName={SIDEBAR_INNER_CLASSNAME}
    data-testid="sidebar-container"
  >
    <SidebarHeader>{topBar}</SidebarHeader>

    {variant}
    {footer}
  </Sidebar>
)
