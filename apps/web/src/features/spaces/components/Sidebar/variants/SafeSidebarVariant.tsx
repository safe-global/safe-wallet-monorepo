import type { ReactElement } from 'react'
import { useRouter } from 'next/router'
import { Settings } from 'lucide-react'
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
import type { SafeSidebarVariantProps } from '../types'
import { AppRoutes } from '@/config/routes'
import { NavItem } from './NavItem'
import { NewTransactionButton } from '../NewTransactionButton'
import { SpaceSelectorDropdown } from './SpaceSelectorDropdown'
import { BackToSpaceButton } from './../BackToSpaceButton'
import Link from 'next/link'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { isNonCriticalUpdate } from '@safe-global/utils/utils/chains'

export const SafeSidebarVariant = ({
  workspaceHeader,
  mainNavItems,
  defiGroup,
}: SafeSidebarVariantProps): ReactElement => {
  const router = useRouter()
  const { safe } = useSafeInfo()
  const safeAddress = typeof router.query.safe === 'string' ? router.query.safe : undefined
  const isOutdated =
    safe.implementationVersionState === ImplementationVersionState.OUTDATED && !isNonCriticalUpdate(safe.version)
  const settingsHref = {
    pathname: AppRoutes.settings.setup,
    query: safeAddress ? { safe: safeAddress } : {},
  }
  const isSettingsActive = router.pathname === AppRoutes.settings.setup

  const workspaceHeaderEl =
    workspaceHeader.variant === 'backToSpace' ? (
      <BackToSpaceButton {...workspaceHeader} />
    ) : (
      <SpaceSelectorDropdown
        triggerVariant="addToWorkspace"
        selectedSpace={workspaceHeader.selectedSpace}
        spaces={workspaceHeader.spaces}
        onSpaceAdded={workspaceHeader.onSpaceAdded}
      />
    )

  return (
    <SidebarContent className={css.sidebarContent}>
      <SidebarGroup className={css.sidebarGroup}>
        <SidebarMenu>
          <SidebarMenuItem>{workspaceHeaderEl}</SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* New Transaction */}
      <SidebarGroup className={`${css.sidebarGroup} py-0`}>
        <SidebarGroupContent>
          <NewTransactionButton />
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Main Navigation */}
      <SidebarGroup className={css.sidebarGroup}>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0">
            {mainNavItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* DeFi Group - only show if has items */}
      {defiGroup.items.length > 0 && (
        <SidebarGroup className={css.sidebarGroup}>
          <SidebarGroupLabel>{defiGroup.label}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              {defiGroup.items.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Settings */}
      <SidebarGroup className={css.sidebarGroup}>
        <SidebarGroupContent>
          <SidebarMenu className="gap-0">
            <SidebarMenuItem className="relative">
              <SidebarMenuButton
                size="lg"
                isActive={isSettingsActive}
                className={`h-9 gap-3 ${css.sidebarInteractive} ${css.sidebarNavItem}`}
                render={<Link href={settingsHref} />}
                data-testid="sidebar-settings-item"
              >
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
              {isOutdated && <span className={css.outdatedDot} aria-hidden />}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  )
}
