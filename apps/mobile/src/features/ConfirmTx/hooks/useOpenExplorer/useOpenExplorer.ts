import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { Linking } from 'react-native'

function useOpenExplorer(address: string) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const viewOnExplorer = () => {
    const link = getExplorerLink(address, activeChain.blockExplorerUriTemplate)
    Linking.openURL(link.href)
  }

  return viewOnExplorer
}

export default useOpenExplorer
