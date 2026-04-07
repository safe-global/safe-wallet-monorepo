import type { ReactElement } from 'react'
import Link from 'next/link'
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { ResolvedSidebarItem } from '../types'
import { getSidebarItemTestId } from '../utils'
import css from '../styles.module.css'

const getBadgeAriaLabel = (label: string, count: number): string =>
  `${count} ${label} ${count === 1 ? 'notification' : 'notifications'}`

interface NavItemProps {
  item: ResolvedSidebarItem
  /** Spaces sidebar: per-label test ids; no tooltip wrapper so disabled state reaches the DOM. */
  isSpacesVariant?: boolean
}

export const NavItem = ({ item, isSpacesVariant = false }: NavItemProps): ReactElement => {
  const dataTestId = isSpacesVariant ? getSidebarItemTestId(item.label) : 'sidebar-list-item'

  const menuButton = (
    <SidebarMenuButton
      size="lg"
      isActive={item.isActive}
      disabled={item.disabled}
      className={`h-9 gap-3 ${css.sidebarInteractive} ${css.sidebarNavItem}`}
      render={!item.disabled ? <Link href={item.link} /> : undefined}
      data-testid={dataTestId}
    >
      <item.icon />
      <span>{item.label}</span>
    </SidebarMenuButton>
  )

  const interactive = isSpacesVariant ? (
    menuButton
  ) : (
    <Tooltip>
      <TooltipTrigger className="block w-full">{menuButton}</TooltipTrigger>
      {item.disabled && <TooltipContent side="right">You need to activate your Safe first.</TooltipContent>}
    </Tooltip>
  )

  return (
    <SidebarMenuItem className="relative">
      {interactive}
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
}
