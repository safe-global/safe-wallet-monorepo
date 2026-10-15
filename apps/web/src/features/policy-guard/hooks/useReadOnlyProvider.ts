import { useEffect, useMemo, useState } from 'react'
import type { JsonRpcProvider } from 'ethers'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import useChainId from '@/hooks/useChainId'
import { useChain } from '@/hooks/useChains'
import type { getSharedReadOnlyProvider } from '@/hooks/wallets/sharedReadOnlyProvider'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { logError } from '@/services/exceptions'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'

type SharedProviderModule = { getSharedReadOnlyProvider: typeof getSharedReadOnlyProvider }

export const useReadOnlyProvider = (chainId?: string): { provider?: JsonRpcProvider; error?: Error } => {
  const chain = useChain(chainId ?? '')
  const currentChainId = useChainId()
  const currentProvider = useWeb3ReadOnly()
  const customRpc = useAppSelector(selectRpc)
  const customRpcUrl = chain ? customRpc?.[chain.chainId] : undefined
  const isCurrentChain = !!chain && chain.chainId === currentChainId
  const [sharedProviders, setSharedProviders] = useState<SharedProviderModule>()
  const [error, setError] = useState<Error>()

  useEffect(() => {
    if (!chain || isCurrentChain || sharedProviders) return
    let cancelled = false
    // Dynamic import keeps ethers out of the main bundle
    import('@/hooks/wallets/sharedReadOnlyProvider')
      .then((module) => {
        if (!cancelled) setSharedProviders(module)
      })
      .catch((loadError) => {
        logError(ErrorCodes._654, loadError)
        if (!cancelled) setError(asError(loadError))
      })
    return () => {
      cancelled = true
    }
  }, [chain, isCurrentChain, sharedProviders])

  const provider = useMemo(() => {
    if (!chain) return
    if (isCurrentChain) return currentProvider
    return sharedProviders?.getSharedReadOnlyProvider(chain, customRpcUrl)
  }, [chain, isCurrentChain, currentProvider, customRpcUrl, sharedProviders])

  return { provider, error: provider ? undefined : error }
}
