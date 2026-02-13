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
import { icons, safeMainNavigation, safeDefiGroup } from './config'
import css from './styles.module.css'

export const SafeSidebarWrapper = (): ReactElement => {
  return (
    <SidebarContent>
      {/* Back to Space */}
      <SidebarGroup>
        <div className="flex gap-1 items-center w-full">
          <button
            type="button"
            className={'flex items-center justify-center size-5 shrink-0 ' + css.sidebarInteractive}
          >
            <icons.ChevronLeft className="size-5" />
          </button>
          <div className="flex gap-3 items-center min-h-[36px] px-3 py-2 flex-1 rounded-md">
            <Avatar className="size-6 rounded-md">
              <AvatarFallback className="rounded-md bg-primary text-primary-foreground text-xs">A</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold text-sm">Acme Inc</span>
              <span className="text-xs text-muted-foreground">Space</span>
            </div>
          </div>
        </div>
      </SidebarGroup>

      {/* Main Navigation */}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {safeMainNavigation.map((item) => (
              <SidebarMenuItem key={item.href} className="relative">
                <SidebarMenuButton isActive={item.isActive} tooltip={item.label} className={css.sidebarInteractive}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.badge !== undefined && item.badge > 0 && (
                  <>
                    <span
                      className={
                        css.transactionsBadge + ' absolute right-1 top-1/2 -translate-y-1/2 text-xs font-medium'
                      }
                    >
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
