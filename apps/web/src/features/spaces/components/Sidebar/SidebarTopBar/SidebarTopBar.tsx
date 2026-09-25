import { type ReactElement } from 'react'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'
import { AppRoutes } from '@/config/routes'
import SafeLogo from '@/components/common/SafeLogo'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useIsHydrated } from '@/hooks/useIsHydrated'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useSpacePlan } from '../../../hooks/useSpacePlan'
import { useSafeSponsoredTxs } from '../../../hooks/useSafeSponsoredTxs'

export const SidebarTopBar = (): ReactElement => {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const safeAddress = useSafeAddressFromUrl()
  const isSpaceRoute = useIsSpaceRoute()
  const isHydrated = useIsHydrated()
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const { plan } = useSpacePlan(isSpaceRoute ? undefined : null)
  // On a Safe's pages the last-used Workspace says nothing about this Safe: it must belong to a Workspace on a plan.
  const { isPro: isSafeOnPlan } = useSafeSponsoredTxs()

  // Inside a space or a safe the logo becomes a "Home" pill, or on Safe Pro a PRO chip back to the Workspaces list.
  //
  // Gated on hydration because both inputs are client-only: the safe address lives in a query param
  // the server can't see during SSG (useSafeAddressFromUrl falls back to `location.search`), and the
  // collapsed state comes from a cookie the sidebar reads on mount. Deciding the variant on the
  // first pass disagrees with the server HTML and trips React's hydration check. Same outcome as
  // dev's state+effect, without the extra render.
  const isInSafeOrSpace = Boolean(safeAddress) || isSpaceRoute
  const showHomeLabel = isHydrated && isInSafeOrSpace && !isCollapsed
  const showProLockup = isSafePro && (isSpaceRoute ? plan !== null : Boolean(safeAddress) && isSafeOnPlan)
  const logoHref = (isSafePro && isSpaceRoute) || showProLockup ? AppRoutes.welcome.spaces : AppRoutes.welcome.accounts
  // Collapsed, the pill has no room: the chip stacks under the logo and the trigger moves down to make way.
  const showCollapsedChip = isCollapsed && showProLockup

  return (
    <div
      data-testid="sidebar-top-bar"
      data-sidebar-state={state}
      className={cn('relative w-full', isCollapsed ? (showCollapsedChip ? 'min-h-22' : 'min-h-15') : 'h-10')}
    >
      <SafeLogo
        href={logoHref}
        showHomeLabel={showHomeLabel}
        showProLockup={showProLockup}
        data-testid="logo-container"
        className={cn(
          'absolute z-10 top-1/2 -translate-y-1/2',
          (showHomeLabel || isCollapsed) && 'shadow-xs',
          showHomeLabel
            ? 'left-0'
            : isCollapsed
              ? 'left-1/2 top-0 -translate-x-1/2 translate-y-0 size-9 rounded-md bg-sidebar-accent'
              : 'left-3',
        )}
      />
      {showCollapsedChip && (
        <span
          className="absolute top-[42px] left-1/2 block h-5 w-8 -translate-x-1/2"
          role="img"
          aria-label="Safe Pro"
          data-testid="collapsed-pro-chip"
        >
          <ProChip className="size-full" />
        </span>
      )}
      <SidebarTrigger
        size="icon"
        className={cn(
          'absolute z-10 shrink-0 cursor-pointer text-sidebar-foreground/65 hover:text-sidebar-foreground hover:secondary',
          'transition-[left,transform] duration-200 ease-linear',
          isCollapsed
            ? showCollapsedChip
              ? 'left-1/2 top-[66px] -translate-x-1/2'
              : 'left-1/2 top-[38px] -translate-x-1/2'
            : 'left-[calc(100%-2rem)] -top-2',
        )}
        data-testid="sidebar-trigger"
      />
    </div>
  )
}
