import type { ReactElement } from 'react'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from '@/components/ui/sidebar'
import { icons } from './config'
import css from './styles.module.css'

export const SidebarCommonFooter = (): ReactElement => {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Help" className={css.sidebarInteractive}>
            <icons.CircleHelp />
            <span>Help</span>
          </SidebarMenuButton>
          <SidebarMenuAction showOnHover className={css.sidebarInteractive}>
            <icons.EllipsisVertical />
            <span className="sr-only">More options</span>
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
