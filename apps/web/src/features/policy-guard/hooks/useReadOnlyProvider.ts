import { useEffect, useState } from 'react'
import type { JsonRpcProvider } from 'ethers'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { useChain } from '@/hooks/useChains'
import { logError } from '@/services/exceptions'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'

// One provider per chain and RPC, so many Safes on a chain share its request batching
const providers = new Map<string, JsonRpcProvider>()

export const useReadOnlyProvider = (chainId?: string): { provider?: JsonRpcProvider; error?: Error } => {
  const chain = useChain(chainId ?? '')
  const customRpc = useAppSelector(selectRpc)
  const customRpcUrl = chain ? customRpc?.[chain.chainId] : undefined
  const key = chain ? `${chain.chainId}:${customRpcUrl || chain.rpcUri.value}` : undefined
  const [, setCreated] = useState(0)
  const [failure, setFailure] = useState<{ key: string; error: Error }>()

  useEffect(() => {
    if (!chain || !key || providers.has(key)) return
    let cancelled = false
    // Dynamic import keeps ethers out of the main bundle
    import('@/hooks/wallets/web3')
      .then(({ createWeb3ReadOnly }) => {
        if (!providers.has(key)) {
          const provider = createWeb3ReadOnly(chain, customRpcUrl)
          if (provider) providers.set(key, provider)
        }
        if (!cancelled) setCreated((count) => count + 1)
      })
      .catch((error) => {
        logError(ErrorCodes._654, error)
        if (!cancelled) setFailure({ key, error: asError(error) })
      })
    return () => {
      cancelled = true
    }
  }, [chain, key, customRpcUrl])

  const provider = key ? providers.get(key) : undefined
  return { provider, error: !provider && failure && failure.key === key ? failure.error : undefined }
}
