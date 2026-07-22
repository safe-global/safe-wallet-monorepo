import type { ReactElement } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { SidebarTopBar } from '../SidebarTopBar'
import css from '../styles.module.css'

const SIDEBAR_CONTAINER_CLASSNAME = '!p-0 border-r-0 group-data-[side=left]:border-r-0'
// Keep the divider identical to EnhancedSidebar so the skeleton doesn't pop a border on load.
const SIDEBAR_INNER_CLASSNAME =
  'rounded-[0_8px_8px_0] group-data-[variant=floating]:rounded-[0_8px_8px_0] shadow-none border-r border-sidebar-border group-data-[variant=floating]:ring-0'

export const Pulse = ({ className }: { className: string }): ReactElement => (
  <div className={`bg-sidebar-border animate-pulse ${className}`} />
)

const NavRow = (): ReactElement => (
  <SidebarMenuItem>
    <div className="relative flex h-9 min-h-9 w-full items-center rounded-md p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
      <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:hidden">
        <Pulse className="size-4 shrink-0 rounded-md" />
        <Pulse className="h-4 min-h-4 flex-1 rounded-md" />
      </div>
      <Pulse className="hidden size-8 shrink-0 rounded-md group-data-[collapsible=icon]:block" />
    </div>
  </SidebarMenuItem>
)

export const SidebarSkeleton = ({ contained = false }: { contained?: boolean }): ReactElement => {
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      contained={contained}
      containerClassName={SIDEBAR_CONTAINER_CLASSNAME}
      innerClassName={SIDEBAR_INNER_CLASSNAME}
      data-testid="sidebar-skeleton"
    >
      <SidebarHeader>
        <SidebarTopBar />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className={`${css.sidebarGroup} mb-2`}>
          <SidebarGroupContent>
            <Pulse className="h-9 w-full rounded-xs group-data-[collapsible=icon]:w-9" />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className={css.sidebarGroup}>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <NavRow />
              <NavRow />
              <NavRow />
              <NavRow />
              <NavRow />
              <NavRow />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className={css.sidebarGroup}>
          <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
            <Pulse className="h-3 w-20 rounded-md" />
          </div>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              <NavRow />
              <NavRow />
              <NavRow />
              <NavRow />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="gap-0.5">
          <NavRow />
          <NavRow />
        </SidebarMenu>
        <div className="flex items-center gap-3 px-3 py-2">
          <Pulse className="size-5 rounded-full" />
          <Pulse className="h-4 w-24 rounded-md group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
