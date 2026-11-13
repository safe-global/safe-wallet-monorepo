import { FEATURES } from '@safe-global/utils/utils/chains'
import { useIsActiveMember } from '@/features/spaces'
import { useHasFeature } from '@/hooks/useChains'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useIsBelowMd } from '@/hooks/useMediaQuery'

export const useCanShowWorkspaceTour = (): boolean => {
  const isEnabled = useHasFeature(FEATURES.WORKSPACE_TOUR) === true
  const isSpaceRoute = useIsSpaceRoute()
  const isActiveMember = useIsActiveMember()
  const isSidebarHidden = useIsBelowMd()

  return isEnabled && isSpaceRoute && isActiveMember && !isSidebarHidden
}
