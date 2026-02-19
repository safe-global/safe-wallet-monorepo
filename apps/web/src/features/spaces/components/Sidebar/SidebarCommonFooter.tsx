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

const HELP_URL = 'https://help.safe.global/en/'

export const SidebarCommonFooter = (): ReactElement => {
  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            className={cn(css.sidebarInteractive, css.footerHelp)}
            render={<a href={HELP_URL} target="_blank" rel="noopener noreferrer" />}
          >
            <icons.CircleHelp />
            <span>Help</span>
          </SidebarMenuButton>
          <SidebarMenuAction className={cn(css.sidebarInteractive, css.footerMenuAction)}>
            <icons.EllipsisVertical />
            <span className="sr-only">More options</span>
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
