import type { ReactElement } from 'react'
import Image from 'next/image'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

export const SidebarTopBar = (): ReactElement => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <div
      className={
        isCollapsed
          ? 'flex flex-col items-center justify-center gap-2 w-full'
          : 'flex items-center justify-between w-full'
      }
    >
      <div className="relative shrink-0 size-6 flex items-center justify-center cursor-pointer">
        <Image src="/images/logo-no-text.svg" alt="Safe" width={24} height={24} className="size-6" />
      </div>
      <SidebarTrigger className="shrink-0 cursor-pointer" />
    </div>
  )
}
