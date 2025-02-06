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

const Navigation = (): ReactElement => {
  const router = useRouter()

  return (
    <SidebarList>
      {navItems.map((item) => {
        const isSelected = router.pathname === item.href

        return (
          <div key={item.href}>
            <ListItemButton sx={{ padding: 0 }} selected={isSelected} key={item.href}>
              <SidebarListItemButton selected={isSelected} href={item.href}>
                {item.icon && <SidebarListItemIcon>{item.icon}</SidebarListItemIcon>}

                <SidebarListItemText data-testid="sidebar-list-item" bold>
                  {item.label}
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
