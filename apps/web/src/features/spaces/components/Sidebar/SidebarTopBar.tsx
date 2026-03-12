import type { ReactElement } from 'react'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import css from './SidebarTopBar.module.css'

export const SidebarTopBar = (): ReactElement => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <div
      data-testid="sidebar-top-bar"
      className={
        isCollapsed
          ? 'flex flex-col items-center justify-center gap-2 w-full'
          : 'flex items-center justify-between w-full'
      }
    >
      <div
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
      </div>
      <SidebarTrigger
        className="shrink-0 cursor-pointer text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        data-testid="sidebar-trigger"
      />
    </div>
  )
}
