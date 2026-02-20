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
    <SidebarFooter data-testid="sidebar-common-footer">
      <SidebarMenu data-testid="footer-menu">
        <SidebarMenuItem data-testid="help-menu-item">
          <SidebarMenuButton
            size="lg"
            className={cn(css.sidebarInteractive, css.footerHelp)}
            render={<a href={HELP_URL} target="_blank" rel="noopener noreferrer" />}
            data-testid="help-menu-button"
          >
            <icons.CircleHelp data-testid="help-icon" />
            <span>Help</span>
          </SidebarMenuButton>
          <SidebarMenuAction
            className={cn(css.sidebarInteractive, css.footerMenuAction)}
            data-testid="help-menu-action"
          >
            <icons.EllipsisVertical data-testid="ellipsis-icon" />
            <span className="sr-only">More options</span>
          </SidebarMenuAction>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
