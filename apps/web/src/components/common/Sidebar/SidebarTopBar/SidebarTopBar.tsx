import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { AppRoutes } from '@/config/routes'
import SafeLogo from '@/components/common/SafeLogo'

export const SidebarTopBar = (): ReactElement => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const router = useRouter()

  const logoHref = router.pathname === AppRoutes.welcome.accounts ? AppRoutes.welcome.index : AppRoutes.welcome.accounts

  return (
    <div
      data-testid="sidebar-top-bar"
      data-sidebar-state={state}
      className={cn('relative w-full', isCollapsed ? 'min-h-16' : 'h-10')}
    >
      <SafeLogo href={logoHref} data-testid="logo-container" className="absolute left-3 top-3 z-10" />
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
