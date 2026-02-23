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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { icons, safeMainNavigation, safeDefiGroup } from '../config'
import css from '../styles.module.css'
import type { SpaceSelectorProps } from '../types'

const getSpaceInitial = (name: string | undefined, initial: string | undefined): string =>
  initial ?? (name?.charAt(0) ?? '').toUpperCase()

const getBadgeAriaLabel = (label: string, count: number): string =>
  `${count} ${label} ${count === 1 ? 'notification' : 'notifications'}`

export const SafeSidebarVariant = ({ spaceName = '', spaceInitial }: SpaceSelectorProps): ReactElement => {
  const initial = getSpaceInitial(spaceName, spaceInitial)
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Back to Space" className={css.backToSpace}>
              <Avatar className={css.spaceSelectorAvatar}>
                <AvatarFallback className={css.spaceSelectorAvatarFallback}>{initial}</AvatarFallback>
              </Avatar>
              <div className={css.spaceSelectorText}>
                <span className={css.spaceSelectorName}>{spaceName}</span>
                <span className={css.spaceSelectorSubtitle}>Space</span>
              </div>
              <icons.ChevronLeft className="ml-auto size-4 shrink-0" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* Main Navigation */}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {safeMainNavigation.map((item) => (
              <SidebarMenuItem key={item.href} className="relative">
                <SidebarMenuButton
                  size="lg"
                  isActive={item.isActive}
                  tooltip={item.label}
                  className={css.sidebarInteractive}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.badge !== undefined && item.badge > 0 && (
                  <>
                    <span className={css.transactionsBadge} aria-label={getBadgeAriaLabel(item.label, item.badge)}>
                      {item.badge}
                    </span>
                    <span className={css.transactionsBadgeDot} aria-hidden />
                  </>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Defi Group */}
      <SidebarGroup>
        <SidebarGroupLabel>{safeDefiGroup.label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {safeDefiGroup.items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton size="lg" tooltip={item.label} className={css.sidebarInteractive}>
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
