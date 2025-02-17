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
  const orgId = Array.isArray(router.query.orgId) ? router.query.orgId[0] : router.query.orgId || ''

  return (
    <SidebarList>
      {navItems.map((item) => {
        const itemPath = item.href(orgId)
        const isSelected = router.asPath === itemPath

        return (
          <div key={itemPath}>
            <ListItemButton sx={{ padding: 0 }} selected={isSelected} key={itemPath}>
              <SidebarListItemButton selected={isSelected} href={itemPath}>
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
