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
import { getSidebarItemTestId } from '../utils'
import { SpaceSelectorDropdown } from './SpaceSelectorDropdown'

interface SpacesSidebarVariantProps extends SpaceSelectorProps {
  mainNavItems: ResolvedSidebarItem[]
  setupGroup: ResolvedSidebarGroup
}

const getBadgeAriaLabel = (label: string, count: number): string =>
  `${count} ${label} ${count === 1 ? 'notification' : 'notifications'}`

const NavItem = ({ item }: { item: ResolvedSidebarItem }): ReactElement => (
  <SidebarMenuItem key={item.href} className="relative">
    <SidebarMenuButton
      size="lg"
      isActive={item.isActive}
      disabled={item.disabled}
      data-testid={getSidebarItemTestId(item.label)}
      className={css.sidebarInteractive}
      // No tooltip: when set, TooltipTrigger is used and does not forward disabled to the DOM.
      render={!item.disabled ? <Link href={item.link} /> : undefined}
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
