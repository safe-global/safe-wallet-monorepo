import { useIsActiveMember } from '@/features/spaces'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useIsBelowMd } from '@/hooks/useMediaQuery'

export const useCanShowWorkspaceTour = (): boolean => {
  const isSpaceRoute = useIsSpaceRoute()
  const isActiveMember = useIsActiveMember()
  const isSidebarHidden = useIsBelowMd()

  return isSpaceRoute && isActiveMember && !isSidebarHidden
}
