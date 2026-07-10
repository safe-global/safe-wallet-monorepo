import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { AppRoutes } from '@/config/routes'
import SafeLogo from '@/components/common/SafeLogo'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

export const SidebarTopBar = (): ReactElement => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const router = useRouter()
  const safeAddress = useSafeAddressFromUrl()
  const isSpaceRoute = useIsSpaceRoute()

  // Inside a space or an individual safe the logo turns into a "Home" label pill that returns to the
  // top-level accounts view. Elsewhere it stays a plain logo toggling between the welcome routes.
  const isInSafeOrSpace = Boolean(safeAddress) || isSpaceRoute
  const showHomeLabel = isInSafeOrSpace && !isCollapsed
  const logoHref = isInSafeOrSpace
    ? AppRoutes.welcome.accounts
    : router.pathname === AppRoutes.welcome.accounts
      ? AppRoutes.welcome.index
      : AppRoutes.welcome.accounts

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
        className={showHomeLabel ? 'absolute left-0 top-1/2 z-10 -translate-y-1/2' : 'absolute left-3 top-3 z-10'}
      />
      <SidebarTrigger
        className={cn(
          'absolute z-10 shrink-0 cursor-pointer text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent',
          'transition-[left,transform] duration-200 ease-linear',
          isCollapsed ? 'left-1/2 top-10 -translate-x-1/2' : 'left-[calc(100%-2rem)] top-3',
        )}
        data-testid="sidebar-trigger"
      />
    </div>
  )
}
