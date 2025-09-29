import React, { type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { ListItemButton } from '@mui/material'

import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useIsActiceMember } from '@/features/spaces/hooks/useSpaceMembers'
import { navItems } from './config'

const Navigation = (): ReactElement => {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const isActiveMember = useIsActiceMember()

  return (
    <SidebarList>
      {navItems.map((item) => {
        const hideItem = item.activeMemberOnly && !isActiveMember
        const isSelected = router.pathname === item.href

        if (hideItem) return null

        return (
          <div key={item.label}>
            <ListItemButton disabled={item.disabled} sx={{ padding: 0 }} selected={isSelected}>
              <SidebarListItemButton
                selected={isSelected}
                href={item.href ? { pathname: item.href, query: { spaceId } } : ''}
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
