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
      className={
        isCollapsed
          ? 'flex flex-col items-center justify-center gap-2 w-full'
          : 'flex items-center justify-between w-full'
      }
    >
      <button
        type="button"
        onClick={handleLogoClick}
        className="relative shrink-0 size-6 flex items-center justify-center cursor-pointer"
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
        className="shrink-0 cursor-pointer text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        data-testid="sidebar-trigger"
      />
    </div>
  )
}
