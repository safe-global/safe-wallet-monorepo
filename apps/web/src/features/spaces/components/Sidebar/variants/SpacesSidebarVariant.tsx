import type { ReactElement } from 'react'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { spacesMainNavigation, spacesSetupGroup } from '../config'
import css from '../styles.module.css'
import type { SpaceSelectorProps } from '../types'
import { SpaceSelectorDropdown } from './SpaceSelectorDropdown'

export const SpacesSidebarVariant = ({ selectedSpace, spaces }: SpaceSelectorProps): ReactElement => {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SpaceSelectorDropdown selectedSpace={selectedSpace} spaces={spaces} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* Main Navigation */}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {spacesMainNavigation.map((item) => (
              <SidebarMenuItem key={item.href} className="relative">
                <SidebarMenuButton isActive={item.isActive} tooltip={item.label} className={css.sidebarInteractive}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.badge !== undefined && item.badge > 0 && (
                  <>
                    <span className={css.transactionsBadge}>{item.badge}</span>
                    <span className={css.transactionsBadgeDot} aria-hidden />
                  </>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Setup Group */}
      <SidebarGroup>
        <SidebarGroupLabel>{spacesSetupGroup.label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {spacesSetupGroup.items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton tooltip={item.label} className={css.sidebarInteractive}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}
