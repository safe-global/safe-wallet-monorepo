import type { ReactElement, ReactNode } from 'react'
import Link from 'next/link'
import { SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'
import type { ResolvedSidebarItem } from '@views/features/spaces/components/Sidebar/types'
import css from '@/features/spaces/components/Sidebar/styles.module.css'

const getBadgeAriaLabel = (label: string, count: number | string): string =>
  `${count} ${label} ${count === 1 ? 'notification' : 'notifications'}`

const SkeletonPulse = ({ className }: { className: string }): ReactElement => (
  <div className={cn('bg-sidebar-border animate-pulse', className)} />
)

const NavItemSkeleton = (): ReactElement => (
  <div className="relative flex h-9 min-h-9 w-full items-center rounded-md p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2">
    <div className="flex w-full items-center gap-3 group-data-[collapsible=icon]:hidden">
      <SkeletonPulse className="size-4 shrink-0 rounded-md" />
      <SkeletonPulse className="h-4 min-h-4 flex-1 rounded-md" />
    </div>
    <SkeletonPulse className="hidden size-8 shrink-0 rounded-md group-data-[collapsible=icon]:block" />
  </div>
)

export type NavItemViewProps = {
  item: ResolvedSidebarItem | null
  isSpacesVariant: boolean
  isLoading: boolean
  dataTestId: string
  /** Runs the item's action or navigation tracking; not called for disabled items. */
  onItemClick: () => void
  children?: ReactNode
}

export const NavItemView = ({
  item,
  isSpacesVariant,
  isLoading,
  dataTestId,
  onItemClick,
  children,
}: NavItemViewProps): ReactElement => {
  const { state, isMobile, isTablet, setOpenMobile } = useSidebar()

  if (isLoading || !item) {
    return (
      <SidebarMenuItem>
        <NavItemSkeleton />
        {children}
      </SidebarMenuItem>
    )
  }

  const handleClick = () => {
    if (item.disabled) return

    onItemClick()

    // The drawer only closes for navigation, so the destination isn't hidden behind it. Action
    // items open UI mounted inside the drawer's own subtree, which dismissing would unmount.
    if (!item.onSelect && (isMobile || isTablet)) {
      setOpenMobile(false)
    }
  }

  const menuButton = (
    <SidebarMenuButton
      size="lg"
      isActive={item.isActive}
      disabled={item.disabled}
      className={`h-9 gap-3 ${css.sidebarInteractive} ${css.sidebarNavItem}`}
      render={!item.disabled && item.link ? <Link href={item.link} /> : undefined}
      data-testid={dataTestId}
      onClick={handleClick}
    >
      <div className={item.isActive ? css.activeIcon : undefined}>
        {item.indicator ? (
          <span className="relative">
            <item.icon />
            <span className={css.outdatedDot} aria-hidden />
          </span>
        ) : (
          <item.icon />
        )}
      </div>
      <span className="truncate group-data-[collapsible=icon]:hidden">{item.label}</span>
    </SidebarMenuButton>
  )

  // Disabled Safe nav items always explain why they're inactive; for every other item the
  // label tooltip is redundant while the sidebar is expanded, so it only shows when collapsed.
  const showsDisabledReason = item.disabled && !isSpacesVariant
  const tooltipContent = showsDisabledReason ? 'You need to activate your Safe first.' : item.label
  const isTooltipHidden = showsDisabledReason ? false : state !== 'collapsed' || isMobile

  const interactive = (
    <Tooltip>
      <TooltipTrigger render={<span className="block w-full" />}>{menuButton}</TooltipTrigger>
      <TooltipContent side="right" hidden={isTooltipHidden}>
        {tooltipContent}
      </TooltipContent>
    </Tooltip>
  )

  return (
    <SidebarMenuItem className="relative">
      {interactive}
      {!!item.badge && (
        <>
          <span
            className={cn(css.transactionsBadge, item.isActive && css.transactionsBadgeActive)}
            aria-label={getBadgeAriaLabel(item.label, item.badge)}
            data-testid="queued-tx-info"
          >
            {item.badge}
          </span>
          <span className={css.transactionsBadgeDot} aria-hidden />
        </>
      )}
      {children}
    </SidebarMenuItem>
  )
}
