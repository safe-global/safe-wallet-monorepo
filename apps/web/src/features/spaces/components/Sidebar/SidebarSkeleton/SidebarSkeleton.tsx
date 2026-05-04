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

const Pulse = ({ className }: { className: string }): ReactElement => (
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

export const SidebarSkeleton = (): ReactElement => {
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="!p-0 border-r-0 group-data-[side=left]:border-r-0 [&_[data-slot=sidebar-inner]]:rounded-none [&_[data-slot=sidebar-inner]]:rounded-tr-[8px] [&_[data-slot=sidebar-inner]]:rounded-br-[8px] [&_[data-slot=sidebar-inner]]:shadow-none"
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
