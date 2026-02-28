import type { ReactElement } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { SidebarTopBar } from './SidebarTopBar'

const SkeletonRow = ({ heightClass }: { heightClass?: string } = {}): ReactElement => (
  <SidebarMenuItem>
    <div className="flex items-center gap-2 px-3 py-2">
      <div className={`w-48 rounded bg-sidebar-accent animate-pulse ${heightClass ?? 'h-12'}`} />
    </div>
  </SidebarMenuItem>
)

export const SidebarSkeleton = (): ReactElement => {
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="!p-0 border-r-0 group-data-[side=left]:border-r-0 [&_[data-slot=sidebar-inner]]:rounded-none [&_[data-slot=sidebar-inner]]:rounded-tr-sm [&_[data-slot=sidebar-inner]]:rounded-br-sm [&_[data-slot=sidebar-inner]]:shadow-[0_2px_8px_rgba(23,23,23,0.06)]"
    >
      <SidebarHeader>
        <SidebarTopBar />
        <SkeletonRow heightClass="h-18" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <hr className="my-2 w-48 animate-pulse mx-auto" />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
