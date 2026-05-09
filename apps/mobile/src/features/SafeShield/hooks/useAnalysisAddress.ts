import { selectChainById } from '@/src/store/chains'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { useCallback, useState } from 'react'
import { Linking } from 'react-native'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'

export const useAnalysisAddress = () => {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const copyAndDispatchToast = useCopyAndDispatchToast('Copied to clipboard')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopyToClipboard = useCallback(
    (address: string, index: number) => {
      copyAndDispatchToast(address)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1000)
    },
    [copyAndDispatchToast],
  )

  const handleOpenExplorer = useCallback(
    (address: string) => {
      if (activeChain?.blockExplorerUriTemplate) {
        const link = getExplorerLink(address, activeChain.blockExplorerUriTemplate)
        Linking.openURL(link.href)
      }
    },
    [activeChain],
  )

  return {
    handleOpenExplorer,
    handleCopyToClipboard,
    copiedIndex,
  }
}
