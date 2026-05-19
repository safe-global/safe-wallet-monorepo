import React, { type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { ListItemButton } from '@mui/material'

import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/sidebar/SidebarList'
import { useCurrentSpaceId, useIsActiveMember } from '@/features/spaces'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { navItems } from './config'

const Navigation = (): ReactElement => {
  const router = useRouter()
  const spaceId = useCurrentSpaceId()
  const isActiveMember = useIsActiveMember()
  const isSecurityHubEnabled = useHasFeature(FEATURES.SECURITY_HUB)

  return (
    <SidebarList>
      {navItems.map((item) => {
        // Hide the Security entry when the chain feature flag is explicitly off. While the
        // chain config is still loading (`undefined`) we keep the item to avoid flicker.
        const hideForFeatureFlag = item.href === AppRoutes.spaces.security && isSecurityHubEnabled === false
        const hideItem = (item.activeMemberOnly && !isActiveMember) || hideForFeatureFlag
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
