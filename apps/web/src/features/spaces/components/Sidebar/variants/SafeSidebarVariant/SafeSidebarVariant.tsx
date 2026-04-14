import { type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { Settings } from 'lucide-react'
import { motion } from 'motion/react'
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import css from '../../styles.module.css'
import type { SafeSidebarVariantProps } from '../../types'
import { AppRoutes } from '@/config/routes'
import { NavItem } from '../NavItem'
import { SidebarActionButton } from '../../NewTransactionButton'
import { SafeSidebarWorkspaceHeader } from '../SafeSidebarWorkspaceHeader'
import Link from 'next/link'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { isNonCriticalUpdate } from '@safe-global/utils/utils/chains'
import { useIsCounterfactualSafe } from '@/features/counterfactual'
import { useSidebarHydrated } from '../../hooks/useSidebarHydrated'
import { containerVariants, itemVariants } from '../../constants'

export const SafeSidebarVariant = ({
  workspaceHeader,
  mainNavItems,
  defiGroup,
}: SafeSidebarVariantProps): ReactElement => {
  const router = useRouter()
  const { safe } = useSafeInfo()
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const isHydrated = useSidebarHydrated()

  const safeAddress = isHydrated && typeof router.query.safe === 'string' ? router.query.safe : undefined
  const isOutdated =
    isHydrated &&
    safe.implementationVersionState === ImplementationVersionState.OUTDATED &&
    !isNonCriticalUpdate(safe.version)
  const settingsHref = {
    pathname: AppRoutes.settings.setup,
    query: safeAddress ? { safe: safeAddress } : {},
  }
  const isSettingsActive = router.pathname === AppRoutes.settings.setup

  const shouldRenderWorkspaceHeaderGroup =
    workspaceHeader.variant === 'backToSpace' || !(isHydrated && isCounterfactualSafe)

  return (
    <SidebarContent>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {shouldRenderWorkspaceHeaderGroup && (
          <motion.div variants={itemVariants}>
            <SidebarGroup className={css.sidebarGroup}>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SafeSidebarWorkspaceHeader workspaceHeader={workspaceHeader} />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </motion.div>
        )}

        {/* Action Button */}
        <motion.div variants={itemVariants}>
          <SidebarGroup className={css.sidebarGroup}>
            <SidebarGroupContent>
              <SidebarActionButton />
            </SidebarGroupContent>
          </SidebarGroup>
        </motion.div>

        {/* Main Navigation */}
        <motion.div variants={itemVariants}>
          <SidebarGroup className={css.sidebarGroup}>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0">
                {mainNavItems.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </motion.div>

        {/* DeFi Group - only show if has items */}
        {defiGroup.items.length > 0 && (
          <motion.div variants={itemVariants}>
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
          </motion.div>
        )}

        {/* Settings */}
        <motion.div variants={itemVariants}>
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
                    <Tooltip>
                      <TooltipTrigger>
                        <Settings className="text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right">Settings</TooltipContent>
                    </Tooltip>
                    <span>Settings</span>
                  </SidebarMenuButton>
                  {isOutdated && <span className={css.outdatedDot} aria-hidden />}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </motion.div>
      </motion.div>
    </SidebarContent>
  )
}
