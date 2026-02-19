import type { ReactElement } from 'react'
import Link from 'next/link'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import css from '../styles.module.css'
import type { SpaceSelectorProps, ResolvedSidebarItem, ResolvedSidebarGroup } from '../types'
import { SpaceSelectorDropdown } from './SpaceSelectorDropdown'

interface SpacesSidebarVariantProps extends SpaceSelectorProps {
  mainNavItems: ResolvedSidebarItem[]
  setupGroup: ResolvedSidebarGroup
}

const NavItem = ({ item }: { item: ResolvedSidebarItem }): ReactElement => (
  <SidebarMenuItem key={item.href} className="relative">
    <SidebarMenuButton
      isActive={item.isActive}
      disabled={item.disabled}
      className={css.sidebarInteractive}
      // When disabled: tooltip identifies the item in collapsed state; no render (no navigation).
      // When enabled: render as Link for navigation; tooltip is omitted because SidebarMenuButton
      // overrides the render prop with TooltipTrigger when tooltip is set.
      tooltip={item.disabled ? item.label : undefined}
      render={!item.disabled ? <Link href={item.link} /> : undefined}
    >
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
)

export const SpacesSidebarVariant = ({
  selectedSpace,
  spaces,
  mainNavItems,
  setupGroup,
}: SpacesSidebarVariantProps): ReactElement => {
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
            {mainNavItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Setup Group */}
      <SidebarGroup>
        <SidebarGroupLabel>{setupGroup.label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {setupGroup.items.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}
