import type { ReactElement } from 'react'
import type { ResolvedSidebarActionItem, SidebarDeveloperItemConfig } from '../../types'
import { getSidebarActionItemTestId } from '../../utils'
import { NavItem } from '../NavItem'

interface SidebarDeveloperItemProps {
  config: SidebarDeveloperItemConfig
  isLoading?: boolean
}

/**
 * Renders one developer entry. Each entry gets its own component so its `useItemState` hook runs at a
 * component's top level — that is what keeps entries independent instead of sharing one group-wide state.
 */
export const SidebarDeveloperItem = ({ config, isLoading = false }: SidebarDeveloperItemProps): ReactElement => {
  const { badge, onSelect, dialog } = config.useItemState()

  const item: ResolvedSidebarActionItem = {
    icon: config.icon,
    label: config.label,
    id: config.id,
    badge,
    isActive: false,
    disabled: false,
    testId: getSidebarActionItemTestId(config.id),
    onSelect,
  }

  return (
    <NavItem item={item} isLoading={isLoading}>
      {dialog}
    </NavItem>
  )
}
