import type { ReactElement } from 'react'
import Link from 'next/link'
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import type { ResolvedSidebarItem } from '../types'
import css from '../styles.module.css'

const getBadgeAriaLabel = (label: string, count: number): string =>
  `${count} ${label} ${count === 1 ? 'notification' : 'notifications'}`

export const NavItem = ({ item }: { item: ResolvedSidebarItem }): ReactElement => (
  <SidebarMenuItem className="relative">
    <SidebarMenuButton
      size="lg"
      isActive={item.isActive}
      disabled={item.disabled}
      className={`${css.sidebarInteractive} ${css.sidebarNavItem}`}
      render={!item.disabled ? <Link href={item.link} /> : undefined}
      data-testid="sidebar-list-item"
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
