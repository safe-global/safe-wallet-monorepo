import type { ReactElement } from 'react'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { icons } from './config'
import css from './styles.module.css'

export const SidebarCommonFooter = (): ReactElement => {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" tooltip="Help" className={cn(css.sidebarInteractive, css.footerHelp)}>
            <icons.CircleHelp />
            <span>Help</span>
          </SidebarMenuButton>
          <SidebarMenuAction className={css.sidebarInteractive}>
            <icons.EllipsisVertical />
            <span className="sr-only">More options</span>
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
