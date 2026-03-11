import type { ReactElement } from 'react'
import SafeLogo from '@/public/images/logo-no-text.svg'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

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
        <SafeLogo
          className="size-6 text-[#1B2030] dark:text-[var(--primary)]"
          data-testid="logo-image"
          aria-label="Safe"
          role="img"
        />
      </div>
      <SidebarTrigger
        className="shrink-0 cursor-pointer text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        data-testid="sidebar-trigger"
      />
    </div>
  )
}
