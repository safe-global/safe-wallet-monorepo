import { useEffect, useState, type ReactElement } from 'react'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { AppRoutes } from '@/config/routes'
import SafeLogo from '@/components/common/SafeLogo'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

export const SidebarTopBar = (): ReactElement => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const safeAddress = useSafeAddressFromUrl()
  const isSpaceRoute = useIsSpaceRoute()

  // Inside a space or an individual safe the logo turns into a "Home" label pill that returns to the
  // top-level accounts view; elsewhere it stays a plain logo linking to that same view.
  // Deferred to after hydration: both source hooks read browser-only state (location.search
  // fallback / persisted store), so their SSR value differs from the first client render.
  const [isInSafeOrSpace, setIsInSafeOrSpace] = useState(false)
  useEffect(() => {
    setIsInSafeOrSpace(Boolean(safeAddress) || isSpaceRoute)
  }, [safeAddress, isSpaceRoute])
  const showHomeLabel = isInSafeOrSpace && !isCollapsed
  const logoHref = AppRoutes.welcome.accounts

  return (
    <div
      data-testid="sidebar-top-bar"
      data-sidebar-state={state}
      className={cn('relative w-full', isCollapsed ? 'min-h-16' : 'h-10')}
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
        className={cn(
          'absolute z-10 shrink-0 cursor-pointer text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent',
          'transition-[left,transform] duration-200 ease-linear',
          isCollapsed ? 'left-1/2 top-11 -translate-x-1/2' : 'left-[calc(100%-2rem)] -top-2',
        )}
        data-testid="sidebar-trigger"
      />
    </div>
  )
}
