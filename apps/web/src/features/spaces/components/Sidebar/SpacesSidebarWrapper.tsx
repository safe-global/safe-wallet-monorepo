import type { ReactElement } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
import { spacesMainNavigation, spacesSetupGroup } from './config'
import css from './styles.module.css'

export const SpacesSidebarWrapper = (): ReactElement => {
  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className={css.spaceSelector}>
              <Avatar className={css.spaceSelectorAvatar + ' rounded-md'}>
                <AvatarFallback className="rounded-md bg-primary text-primary-foreground">A</AvatarFallback>
              </Avatar>
              <div className={css.spaceSelectorText}>
                <span className={css.spaceSelectorName}>Acme Inc</span>
                <span className={css.spaceSelectorSubtitle}>Space</span>
              </div>
              <div className="ml-auto flex flex-col items-center shrink-0 -space-y-1">
                <ChevronUp className="size-4" />
                <ChevronDown className="size-4" />
              </div>
            </SidebarMenuButton>
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
