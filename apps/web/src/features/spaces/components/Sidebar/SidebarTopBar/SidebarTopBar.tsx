import { type ReactElement } from 'react'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { AppRoutes } from '@/config/routes'
import SafeLogo from '@/components/common/SafeLogo'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useIsHydrated } from '@/hooks/useIsHydrated'

export const SidebarTopBar = (): ReactElement => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const safeAddress = useSafeAddressFromUrl()
  const isSpaceRoute = useIsSpaceRoute()
  const isHydrated = useIsHydrated()

  // Inside a space/safe the logo becomes a "Home" pill to the accounts view; else a plain logo. Gated on
  // hydration: both inputs are client-only (query param, cookie), so deciding on the first pass would trip hydration.
  const isInSafeOrSpace = Boolean(safeAddress) || isSpaceRoute
  const showHomeLabel = isHydrated && isInSafeOrSpace && !isCollapsed
  const logoHref = AppRoutes.welcome.accounts

  return (
    <div
      data-testid="sidebar-top-bar"
      data-sidebar-state={state}
      className={cn('relative w-full', isCollapsed ? 'min-h-15' : 'h-10')}
    >
      <SafeLogo
        href={logoHref}
        showHomeLabel={showHomeLabel}
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
      <SidebarTrigger
        size="icon"
        className={cn(
          'absolute z-10 shrink-0 cursor-pointer text-sidebar-foreground/65 hover:text-sidebar-foreground hover:secondary',
          'transition-[left,transform] duration-200 ease-linear',
          isCollapsed ? 'left-1/2 top-[38px] -translate-x-1/2' : 'left-[calc(100%-2rem)] -top-2',
        )}
        data-testid="sidebar-trigger"
      />
    </div>
  )
}
