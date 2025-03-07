import React, { type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { ListItemButton } from '@mui/material'

import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import { navItems } from './config'
import { useCurrentOrgId } from '../../hooks/useCurrentOrgId'

const Navigation = (): ReactElement => {
  const router = useRouter()
  const orgId = useCurrentOrgId()

  return (
    <SidebarList>
      {navItems.map((item) => {
        const isSelected = router.pathname === item.href

        return (
          <div key={item.label}>
            <ListItemButton disabled={item.disabled} sx={{ padding: 0 }} selected={isSelected}>
              <SidebarListItemButton
                selected={isSelected}
                href={item.href ? { pathname: item.href, query: { orgId } } : ''}
              >
                {item.icon && <SidebarListItemIcon>{item.icon}</SidebarListItemIcon>}

                <SidebarListItemText data-testid="sidebar-list-item" bold>
                  {item.label}
                  {item.tag}
                </SidebarListItemText>
              </SidebarListItemButton>
            </ListItemButton>
          </div>
        )
      })}
    </SidebarList>
  )
}

export default React.memo(Navigation)
