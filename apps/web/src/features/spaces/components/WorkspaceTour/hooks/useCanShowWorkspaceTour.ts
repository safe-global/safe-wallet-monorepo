import { FEATURES } from '@safe-global/utils/utils/chains'
import { useWorkspaceLock } from '../../../hooks/useWorkspaceLock'
import { useIsCheckoutReturnUrl } from '../../../hooks/billing/useIsCheckoutReturnUrl'
import { useIsActiveMember } from '../../../public/hooks/useSpaceMembers'
import { useHasFeature } from '@/hooks/useChains'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useIsBelowMd } from '@/hooks/useMediaQuery'

export const useCanShowWorkspaceTour = (): boolean => {
  const isEnabled = useHasFeature(FEATURES.WORKSPACE_TOUR) === true
  const isSpaceRoute = useIsSpaceRoute()
  const isActiveMember = useIsActiveMember()
  const isSidebarHidden = useIsBelowMd()
  const lock = useWorkspaceLock()
  const isUnlocked = !lock.isResolving && !lock.isError && !lock.isLocked
  // The checkout confirmation mounts with the lazy page, too late for the overlay queue to rank it first
  const isConfirmingCheckout = useIsCheckoutReturnUrl()

  return isEnabled && isSpaceRoute && isActiveMember && !isSidebarHidden && isUnlocked && !isConfirmingCheckout
}
