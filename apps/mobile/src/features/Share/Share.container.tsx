import { ShareView } from '@/src/features/Share/components'
import { selectSafeChains } from '@/src/store/safesSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { getChainsByIds } from '@/src/store/chains'

export const ShareContainer = () => {
  const activeSafe = useDefinedActiveSafe()
  const chainsIds = useAppSelector((state: RootState) => selectSafeChains(state, activeSafe.address))
  const safeAvailableOnChains = useAppSelector((state: RootState) => getChainsByIds(state, chainsIds))
  return <ShareView activeSafe={activeSafe} availableChains={safeAvailableOnChains} />
}
