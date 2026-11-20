import { FEATURES } from '@safe-global/utils/utils/chains'
import { useWorkspaceLock } from '../../../hooks/useWorkspaceLock'
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

  return isEnabled && isSpaceRoute && isActiveMember && !isSidebarHidden && isUnlocked
}
