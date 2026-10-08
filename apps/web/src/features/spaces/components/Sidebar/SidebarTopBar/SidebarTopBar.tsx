import { type ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useIsHydrated } from '@/hooks/useIsHydrated'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useSpacePlan } from '../../../hooks/useSpacePlan'
import { useSafeSponsoredTxs } from '../../../hooks/useSafeSponsoredTxs'
import { SidebarTopBarView } from '@views/features/spaces/components/Sidebar/SidebarTopBar/SidebarTopBarView'

export const SidebarTopBar = (): ReactElement => {
  const safeAddress = useSafeAddressFromUrl()
  const isSpaceRoute = useIsSpaceRoute()
  const isHydrated = useIsHydrated()
  const isSafePro = useIsSafeProEnabled()
  const { plan } = useSpacePlan(isSpaceRoute ? undefined : null)
  // On a Safe's pages the last-used Workspace says nothing about this Safe: it must belong to a Workspace on a plan.
  const { isPro: isSafeOnPlan } = useSafeSponsoredTxs()

  // Inside a space or a safe the logo becomes a "Home" pill, or on Safe Pro a PRO chip back to the Workspaces list.
  const isInSafeOrSpace = Boolean(safeAddress) || isSpaceRoute
  const showProLockup = isSafePro && (isSpaceRoute ? plan !== null : Boolean(safeAddress) && isSafeOnPlan)
  const logoHref = (isSafePro && isSpaceRoute) || showProLockup ? AppRoutes.welcome.spaces : AppRoutes.welcome.accounts

  return (
    <SidebarTopBarView
      isHydrated={isHydrated}
      isInSafeOrSpace={isInSafeOrSpace}
      showProLockup={showProLockup}
      logoHref={logoHref}
    />
  )
}
