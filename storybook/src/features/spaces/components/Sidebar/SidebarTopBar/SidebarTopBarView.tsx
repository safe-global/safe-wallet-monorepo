import { type ReactElement } from 'react'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import SafeLogo from '@views/components/common/SafeLogo'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'

export type SidebarTopBarViewProps = {
  isHydrated: boolean
  isInSafeOrSpace: boolean
  showProLockup: boolean
  logoHref: string
}

export const SidebarTopBarView = ({
  isHydrated,
  isInSafeOrSpace,
  showProLockup,
  logoHref,
}: SidebarTopBarViewProps): ReactElement => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  // Gated on hydration: the safe address and the collapsed cookie are client-only, so the first pass must match the server HTML.
  const showHomeLabel = isHydrated && isInSafeOrSpace && !isCollapsed
  // Collapsed, the pill has no room: the chip stacks under the logo and the trigger moves down to make way.
  const showCollapsedChip = isCollapsed && showProLockup

  return (
    <div
      data-testid="sidebar-top-bar"
      data-sidebar-state={state}
      className={cn('relative w-full', isCollapsed ? (showCollapsedChip ? 'min-h-22' : 'min-h-15') : 'h-10')}
    >
      <SafeLogo
        href={logoHref}
        showHomeLabel={showHomeLabel}
        showProLockup={showProLockup}
        data-testid="logo-container"
        className={cn(
          'absolute z-10 top-1/2 -translate-y-1/2',
          (showHomeLabel || isCollapsed) && 'shadow-xs',
          showHomeLabel
            ? 'left-0'
            : isCollapsed
              ? 'left-1/2 top-0 -translate-x-1/2 translate-y-0 size-9 rounded-md bg-sidebar-accent'
              : 'left-3',
        )}
      />
      {showCollapsedChip && (
        <span
          className="absolute top-[42px] left-1/2 block h-5 w-8 -translate-x-1/2"
          role="img"
          aria-label="Safe Pro"
          data-testid="collapsed-pro-chip"
        >
          <ProChip className="size-full" />
        </span>
      )}
      <SidebarTrigger
        size="icon"
        className={cn(
          'absolute z-10 shrink-0 cursor-pointer text-sidebar-foreground/65 hover:text-sidebar-foreground hover:secondary',
          'transition-[left,transform] duration-200 ease-linear',
          isCollapsed
            ? showCollapsedChip
              ? 'left-1/2 top-[66px] -translate-x-1/2'
              : 'left-1/2 top-[38px] -translate-x-1/2'
            : 'left-[calc(100%-2rem)] -top-2',
        )}
        data-testid="sidebar-trigger"
      />
    </div>
  )
}
