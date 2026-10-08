import { type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { Settings } from 'lucide-react'
import type { ResolvedSidebarNavItem, SafeSidebarVariantProps } from '@views/features/spaces/components/Sidebar/types'
import { AppRoutes } from '@/config/routes'
import { NavItem } from '../NavItem'
import { SidebarDeveloperGroup } from '../SidebarDeveloperGroup'
import { SidebarActionButton } from '../../NewTransactionButton'
import { SafeSidebarWorkspaceHeader } from '../SafeSidebarWorkspaceHeader'
import useSafeInfo from '@/hooks/useSafeInfo'
import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { isNonCriticalUpdate } from '@safe-global/utils/utils/chains'
import { useIsCounterfactualSafe } from '@/features/counterfactual'
import { useIsHydrated } from '@/hooks/useIsHydrated'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import { SafeSidebarVariantView } from '@views/features/spaces/components/Sidebar/variants/SafeSidebarVariant/SafeSidebarVariantView'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUrlSpaceId, withSpaceId } from '@/hooks/useUrlSpaceId'

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
  const isHydrated = useIsHydrated()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const safeFromQuery = useSafeQueryParam()
  const spaceId = useUrlSpaceId()
  const safeAddress = isHydrated ? safeFromQuery || undefined : undefined
  const isOutdated =
    isHydrated &&
    safe.implementationVersionState === ImplementationVersionState.OUTDATED &&
    !isNonCriticalUpdate(safe.version)
  const settingsHref = {
    pathname: AppRoutes.settings.setup,
    query: withSpaceId(safeAddress ? { safe: safeAddress } : {}, spaceId),
  }
  const isSettingsActive = router.pathname.startsWith(AppRoutes.settings.index)

  // Settings lives in the main nav group but isn't config-driven: its outdated indicator and
  // active state depend on the current Safe. Render it through NavItem so styling stays in sync.
  const settingsItem: ResolvedSidebarNavItem = {
    icon: Settings,
    label: 'Settings',
    href: AppRoutes.settings.setup,
    link: settingsHref,
    isActive: isSettingsActive,
    disabled: false,
    indicator: isOutdated,
    testId: 'sidebar-settings-item',
  }

  const shouldRenderWorkspaceHeaderGroup =
    workspaceHeader.variant === 'backToSpace' || (isUserSignedIn && !(isHydrated && isCounterfactualSafe))

  // Use provided items or create placeholders for skeleton
  const displayMainNavItems = mainNavItems || Array(MAIN_NAV_SKELETON_COUNT).fill(null)
  const displayDefiItems = defiGroup?.items || Array(DEFI_GROUP_SKELETON_COUNT).fill(null)

  return (
    <SafeSidebarVariantView
      workspaceHeader={
        shouldRenderWorkspaceHeaderGroup ? <SafeSidebarWorkspaceHeader workspaceHeader={workspaceHeader} /> : undefined
      }
      actionButton={<SidebarActionButton />}
      mainNavItems={
        <>
          {displayMainNavItems.map((item, index) => (
            <NavItem key={item?.href ?? `skeleton-main-${index}`} item={item} isLoading={isLoading} />
          ))}
          <NavItem item={settingsItem} isLoading={isLoading} />
        </>
      }
      defiGroup={
        (defiGroup?.items?.length ?? 0) > 0
          ? {
              label: defiGroup?.label ?? '',
              items: displayDefiItems.map((item, index) => (
                <NavItem key={item?.href ?? `skeleton-defi-${index}`} item={item} isLoading={isLoading} />
              )),
            }
          : undefined
      }
      developerGroup={<SidebarDeveloperGroup isLoading={isLoading} />}
    />
  )
}
