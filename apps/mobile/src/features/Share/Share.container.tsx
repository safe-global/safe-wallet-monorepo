import { ShareView } from '@/src/features/Share/components'
import { selectSafeInfo } from '@/src/store/safesSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { getChainsByIds } from '@/src/store/chains'

export const ShareContainer = () => {
  const activeSafe = useDefinedActiveSafe()
  const activeSafeInfo = useAppSelector((state: RootState) => selectSafeInfo(state, activeSafe.address))
  const safeAvailableOnChains = useAppSelector((state: RootState) => getChainsByIds(state, activeSafeInfo.chains))
  return <ShareView activeSafe={activeSafe} availableChains={safeAvailableOnChains} />
}
