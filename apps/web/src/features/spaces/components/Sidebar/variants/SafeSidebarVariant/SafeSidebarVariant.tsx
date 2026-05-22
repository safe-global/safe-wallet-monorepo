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
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { containerVariants, itemVariants } from '../../constants'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

const MAIN_NAV_SKELETON_COUNT = 5
const DEFI_GROUP_SKELETON_COUNT = 4

export const SafeSidebarVariant = ({
  workspaceHeader,
  mainNavItems,
  defiGroup,
  isLoading = false,
}: SafeSidebarVariantProps): ReactElement => {
  const router = useRouter()
  const { safe } = useSafeInfo()
  const isCounterfactualSafe = useIsCounterfactualSafe()
  const isHydrated = useSidebarHydrated()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const safeFromQuery = useSafeQueryParam()
  const safeAddress = isHydrated ? safeFromQuery || undefined : undefined
  const isOutdated =
    isHydrated &&
    safe.implementationVersionState === ImplementationVersionState.OUTDATED &&
    !isNonCriticalUpdate(safe.version)
  const settingsHref = {
    pathname: AppRoutes.settings.setup,
    query: safeAddress ? { safe: safeAddress } : {},
  }
  const isSettingsActive = router.pathname.startsWith(AppRoutes.settings.index)

  const shouldRenderWorkspaceHeaderGroup =
    workspaceHeader.variant === 'backToSpace' || (isUserSignedIn && !(isHydrated && isCounterfactualSafe))

  // Use provided items or create placeholders for skeleton
  const displayMainNavItems = mainNavItems || Array(MAIN_NAV_SKELETON_COUNT).fill(null)
  const displayDefiItems = defiGroup?.items || Array(DEFI_GROUP_SKELETON_COUNT).fill(null)

  return (
    <SidebarContent>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {shouldRenderWorkspaceHeaderGroup && (
          <motion.div variants={itemVariants} className="mb-2">
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
        <motion.div variants={itemVariants} className="mb-2">
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
              <SidebarMenu className="gap-0.5">
                {displayMainNavItems.map((item, index) => (
                  <NavItem key={item?.href ?? `skeleton-main-${index}`} item={item} isLoading={isLoading} />
                ))}
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={isSettingsActive}
                    disabled={isLoading}
                    className={`h-9 gap-3 ${css.sidebarInteractive} ${css.sidebarNavItem}`}
                    render={!isLoading ? <Link href={settingsHref} /> : undefined}
                    data-testid="sidebar-settings-item"
                  >
                    <Tooltip>
                      <TooltipTrigger render={<span />} className="flex min-w-0 cursor-pointer items-center gap-3">
                        <span className="relative">
                          <Settings className="text-muted-foreground" />
                          {isOutdated && <span className={css.outdatedDot} aria-hidden />}
                        </span>
                        <span className="truncate group-data-[collapsible=icon]:hidden">Settings</span>
                      </TooltipTrigger>
                      <TooltipContent side="right">Settings</TooltipContent>
                    </Tooltip>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </motion.div>

        {/* DeFi Group */}
        {(defiGroup?.items?.length ?? 0) > 0 && (
          <motion.div variants={itemVariants}>
            <SidebarGroup className={css.sidebarGroup}>
              <SidebarGroupLabel>{defiGroup?.label ?? ''}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0">
                  {displayDefiItems.map((item, index) => (
                    <NavItem key={item?.href ?? `skeleton-defi-${index}`} item={item} isLoading={isLoading} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </motion.div>
        )}
      </motion.div>
    </SidebarContent>
  )
}
