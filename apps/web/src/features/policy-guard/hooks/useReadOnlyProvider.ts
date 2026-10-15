import { useEffect, useState } from 'react'
import type { JsonRpcProvider } from 'ethers'
import { useChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'

// One provider per chain and RPC, so many Safes on a chain share its request batching
const providers = new Map<string, JsonRpcProvider>()

export const useReadOnlyProvider = (chainId?: string): JsonRpcProvider | undefined => {
  const chain = useChain(chainId ?? '')
  const customRpc = useAppSelector(selectRpc)
  const customRpcUrl = chain ? customRpc?.[chain.chainId] : undefined
  const key = chain ? `${chain.chainId}:${customRpcUrl || chain.rpcUri.value}` : undefined
  const [, setCreated] = useState(0)

  useEffect(() => {
    if (!chain || !key || providers.has(key)) return
    let cancelled = false
    // Dynamic import keeps ethers out of the main bundle
    import('@/hooks/wallets/web3').then(({ createWeb3ReadOnly }) => {
      if (!providers.has(key)) {
        const provider = createWeb3ReadOnly(chain, customRpcUrl)
        if (provider) providers.set(key, provider)
      }
      if (!cancelled) setCreated((count) => count + 1)
    })
    return () => {
      cancelled = true
    }
  }, [chain, key, customRpcUrl])

  return key ? providers.get(key) : undefined
}
