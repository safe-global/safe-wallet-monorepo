import { createContext, useContext, useEffect, useState, type ReactElement } from 'react'
import type { JsonRpcProvider, Web3Provider as Web3ProviderType } from '@ethersproject/providers'

import useWallet from '@/services/wallets/useWallet'
import { useCurrentChain } from '@/services/useChains'
import { createWeb3, createWeb3ReadOnly } from '@/services/wallets/web3'

type Web3ContextType = {
  web3?: Web3ProviderType
  web3ReadOnly?: JsonRpcProvider
}

const Web3Context = createContext<Web3ContextType>({
  web3: undefined,
  web3ReadOnly: undefined,
})

const Web3Provider = ({ children }: { children: ReactElement }): ReactElement => {
  const [web3, setWeb3] = useState<Web3ProviderType>()
  const [web3ReadOnly, setWeb3ReadOnly] = useState<{ chainId: string; provider: JsonRpcProvider }>()

  const chain = useCurrentChain()
  const wallet = useWallet()

  useEffect(() => {
    if (!chain || !wallet || chain.chainId !== wallet.chainId) {
      return
    }
    setWeb3(createWeb3(wallet.provider))
  }, [chain, wallet])

  useEffect(() => {
    if (!chain || web3ReadOnly?.chainId === chain.chainId) {
      return
    }
    // We cache the `chainId` to avoid async `provider.getNetwork()` when comparing above
    setWeb3ReadOnly({
      chainId: chain.chainId,
      provider: createWeb3ReadOnly(chain),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chain])

  return <Web3Context.Provider value={{ web3, web3ReadOnly: web3ReadOnly?.provider }}>{children}</Web3Context.Provider>
}

export const useWeb3 = (): Web3ContextType['web3'] => {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error('useWeb3 must be used within Web3Provider')
  }
  return context.web3
}

export const useWeb3ReadOnly = (): Web3ContextType['web3ReadOnly'] => {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error('useWeb3ReadOnly must be used within Web3Provider')
  }
  return context.web3ReadOnly
}

export default Web3Provider
