import React, { type ReactElement } from 'react'
import { useRouter } from 'next/router'

import {
  SidebarList,
  SidebarListItemButton,
  SidebarListItemIcon,
  SidebarListItemText,
} from '@/components/common/SidebarList'
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
  const isAuditLogEnabled = useHasFeature(FEATURES.SPACE_AUDIT_LOG)

  return (
    <SidebarList>
      {navItems.map((item) => {
        // Hide flag-gated entries when their chain feature flag is explicitly off. While the
        // chain config is still loading (`undefined`) we keep the item to avoid flicker.
        const hideForFeatureFlag =
          (item.href === AppRoutes.spaces.security && isSecurityHubEnabled === false) ||
          (item.href === AppRoutes.spaces.activity && isAuditLogEnabled === false)
        const hideItem = (item.activeMemberOnly && !isActiveMember) || hideForFeatureFlag
        const isSelected = router.pathname === item.href

        if (hideItem) return null

        return (
          <div key={item.label}>
            <SidebarListItemButton
              disabled={item.disabled}
              selected={isSelected}
              href={item.href ? { pathname: item.href, query: { spaceId } } : ''}
            >
              {item.icon && <SidebarListItemIcon>{item.icon}</SidebarListItemIcon>}

              <SidebarListItemText data-testid="sidebar-list-item" bold>
                {item.label}
                {item.tag}
              </SidebarListItemText>
            </SidebarListItemButton>
          </div>
        )
      })}
    </SidebarList>
  )
}

export default React.memo(Navigation)
