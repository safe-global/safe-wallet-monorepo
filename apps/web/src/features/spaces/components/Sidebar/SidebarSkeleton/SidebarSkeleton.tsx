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
import { SidebarTopBar } from '../SidebarTopBar'
import css from '../styles.module.css'

const SIDEBAR_CONTAINER_CLASSNAME = '!p-0 border-r-0 group-data-[side=left]:border-r-0'
const SIDEBAR_INNER_CLASSNAME = 'rounded-none rounded-tr-[8px] rounded-br-[8px] shadow-none'

const SkeletonRow = ({ heightClass }: { heightClass?: string } = {}): ReactElement => (
  <SidebarMenuItem>
    <div className="flex items-center gap-2 px-3 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <div
        className={`rounded bg-sidebar-border animate-pulse w-48 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 ${
          heightClass ?? 'h-12'
        }`}
      />
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
