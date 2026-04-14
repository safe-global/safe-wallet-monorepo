import type { ComponentProps, ReactElement } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { SidebarTopBar } from '../SidebarTopBar'
import css from '../styles.module.css'

const SAFE_SIDEBAR_MAIN_NAV_PLACEHOLDER_COUNT = 5
const SAFE_SIDEBAR_DEFI_PLACEHOLDER_COUNT = 4

const MENU_NAV_CLASS = 'gap-0'
const sidebarGroupClass = css.sidebarGroup

interface SkeletonPulseProps extends Pick<ComponentProps<'div'>, 'aria-hidden'> {
  className: string
}

const SkeletonPulse = ({ className, ...props }: SkeletonPulseProps): ReactElement => (
  <div className={cn('bg-sidebar-border animate-pulse', className)} {...props} />
)

const NavItemSkeletonRow = (): ReactElement => (
  <SidebarMenuItem data-testid="skeleton-row">
    <div className="relative flex h-9 min-h-9 w-full items-center rounded-md p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
      <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:hidden">
        <SkeletonPulse className="size-4 shrink-0 rounded-md" />
        <SkeletonPulse className="h-4 min-h-4 flex-1 rounded-md" />
      </div>
      <SkeletonPulse className="hidden size-8 shrink-0 rounded-md group-data-[collapsible=icon]:block" />
    </div>
  </SidebarMenuItem>
)

const WorkspaceHeaderSkeleton = (): ReactElement => (
  <SidebarMenuItem data-testid="skeleton-row">
    <div className="flex min-h-10 w-full items-center gap-3 rounded-md px-2 py-2 group-data-[collapsible=icon]:justify-center">
      <SkeletonPulse className="size-8 shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
        <SkeletonPulse className="h-4 max-w-full w-24 rounded-md" />
        <SkeletonPulse className="h-3 max-w-full w-16 rounded-md" />
      </div>
    </div>
  </SidebarMenuItem>
)

const ApiCtaExpandedSkeleton = (): ReactElement => (
  <div className="flex flex-col gap-2 rounded-[8px] bg-secondary p-3 group-data-[collapsible=icon]:hidden" aria-hidden>
    <div className="flex w-full items-start justify-between">
      <SkeletonPulse className="size-6 shrink-0 rounded-md" />
      <SkeletonPulse className="size-4 shrink-0 rounded" />
    </div>
    <div className="flex flex-col gap-1.5">
      <SkeletonPulse className="h-3 w-full rounded" />
      <SkeletonPulse className="h-3 w-[92%] rounded" />
      <SkeletonPulse className="h-3 w-4/5 rounded" />
    </div>
    <SkeletonPulse className="h-8 w-28 self-start rounded-md" />
  </div>
)

const NavPlaceholderList = ({ count, keyPrefix }: { count: number; keyPrefix: string }): ReactElement[] =>
  Array.from({ length: count }, (_, i) => <NavItemSkeletonRow key={`${keyPrefix}-${i}`} />)

const SidebarFooterSkeleton = (): ReactElement => (
  <SidebarFooter data-testid="sidebar-skeleton-footer">
    <ApiCtaExpandedSkeleton />

    <SidebarMenu className={cn('hidden', MENU_NAV_CLASS, 'group-data-[collapsible=icon]:block')}>
      <NavItemSkeletonRow />
    </SidebarMenu>

    <SidebarMenu className={MENU_NAV_CLASS}>
      <NavItemSkeletonRow />
    </SidebarMenu>
  </SidebarFooter>
)

export const SidebarSkeleton = (): ReactElement => {
  return (
    <Sidebar
      collapsible="icon"
      variant="floating"
      className="!p-0 border-r-0 group-data-[side=left]:border-r-0 [&_[data-slot=sidebar-inner]]:rounded-none [&_[data-slot=sidebar-inner]]:rounded-tr-[8px] [&_[data-slot=sidebar-inner]]:rounded-br-[8px] [&_[data-slot=sidebar-inner]]:shadow-[0_2px_8px_rgba(23,23,23,0.06)]"
    >
      <SidebarHeader>
        <SidebarTopBar />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className={sidebarGroupClass}>
          <SidebarMenu>
            <WorkspaceHeaderSkeleton />
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className={sidebarGroupClass}>
          <SidebarGroupContent>
            <SkeletonPulse className="mx-auto h-9 w-full rounded-xs group-data-[collapsible=icon]:w-9" aria-hidden />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className={sidebarGroupClass}>
          <SidebarGroupContent>
            <SidebarMenu className={MENU_NAV_CLASS}>
              <NavPlaceholderList count={SAFE_SIDEBAR_MAIN_NAV_PLACEHOLDER_COUNT} keyPrefix="main-nav" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className={sidebarGroupClass}>
          <SidebarGroupLabel>
            <SkeletonPulse className="inline-block h-3 w-10 rounded" aria-hidden />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className={MENU_NAV_CLASS}>
              <NavPlaceholderList count={SAFE_SIDEBAR_DEFI_PLACEHOLDER_COUNT} keyPrefix="defi" />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className={sidebarGroupClass}>
          <SidebarGroupContent>
            <SidebarMenu className={MENU_NAV_CLASS}>
              <NavItemSkeletonRow />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooterSkeleton />
    </Sidebar>
  )
}
