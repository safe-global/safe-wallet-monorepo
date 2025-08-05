import { useAppSelector } from '@/src/store/hooks'
import { getChainsByIds } from '@/src/store/chains'

export const useContactNetworkData = (chainIds: string[]) => {
  const selectedChains = useAppSelector((state) => getChainsByIds(state, chainIds))

  const getDisplayText = () => {
    if (chainIds.length === 0) {
      return 'All Networks'
    }
    if (chainIds.length === 1) {
      return selectedChains[0]?.chainName || 'Unknown Network'
    }
    return `${chainIds.length} Networks`
  }

  return {
    selectedChains,
    displayText: getDisplayText(),
  }
}
