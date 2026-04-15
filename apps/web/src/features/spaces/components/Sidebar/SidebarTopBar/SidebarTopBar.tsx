import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import css from './SidebarTopBar.module.css'
import { AppRoutes } from '@/config/routes'

export const SidebarTopBar = (): ReactElement => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const router = useRouter()

  const logoHref = router.pathname === AppRoutes.welcome.accounts ? AppRoutes.welcome.index : AppRoutes.welcome.accounts

  const handleLogoClick = () => {
    router.push(logoHref)
  }

  return (
    <div
      data-testid="sidebar-top-bar"
      data-sidebar-state={state}
      className="relative w-full transition-transform duration-200 ease-linear origin-top min-h-16"
      style={{
        transform: isCollapsed ? 'scaleY(1)' : 'scaleY(0.625)',
      }}
    >
      <button
        type="button"
        onClick={handleLogoClick}
        className={cn(
          'absolute z-10 flex size-6 shrink-0 cursor-pointer items-center justify-center',
          'transition-[left,top] duration-200 ease-linear',
          isCollapsed ? 'left-[calc(50%-0.75rem)] top-0' : 'left-0 top-[calc(50%-0.75rem)]',
        )}
        data-testid="logo-container"
      >
        <img
          src="/images/logo-no-text.svg"
          alt="Safe"
          width={24}
          height={24}
          className="size-6 dark:hidden"
          data-testid="logo-image"
          role="img"
          aria-label="Safe"
        />
        <span
          className={cn('hidden dark:block size-6 shrink-0 rounded-[2px]', css.logoPrimaryFill)}
          role="img"
          aria-label="Safe"
        />
      </button>
      <SidebarTrigger
        className={cn(
          'absolute z-10 shrink-0 cursor-pointer text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent',
          'transition-[left,top] duration-200 ease-linear',
          isCollapsed ? 'left-[calc(50%-1rem)] top-8' : 'left-[calc(100%-2rem)] top-[calc(50%-1rem)]',
        )}
        data-testid="sidebar-trigger"
      />
    </div>
  )
}
