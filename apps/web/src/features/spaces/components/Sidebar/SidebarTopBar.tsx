import type { ReactElement } from 'react'
import Image from 'next/image'
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
        <Image
          src="/images/logo-no-text.svg"
          alt="Safe"
          width={24}
          height={24}
          className="size-6"
          data-testid="logo-image"
        />
      </div>
      <SidebarTrigger
        className="shrink-0 cursor-pointer text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        data-testid="sidebar-trigger"
      />
    </div>
  )
}
