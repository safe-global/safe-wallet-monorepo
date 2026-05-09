import { useEffect } from 'react'

import { useCurrentChain } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { setWeb3, setWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'

export const useInitWeb3 = () => {
  const chain = useCurrentChain()
  const chainId = chain?.chainId
  const wallet = useWallet()
  const customRpc = useAppSelector(selectRpc)
  const customRpcUrl = chain ? customRpc?.[chain.chainId] : undefined

  useEffect(() => {
    if (wallet && wallet.chainId === chainId) {
      // Dynamic import to keep ethers out of the main bundle
      import('@/hooks/wallets/web3').then(({ createWeb3 }) => {
        const web3 = createWeb3(wallet.provider)
        setWeb3(web3)
      })
    } else {
      setWeb3(undefined)
    }
  }, [wallet, chainId])

  useEffect(() => {
    if (!chain) {
      setWeb3ReadOnly(undefined)
      return
    }
    // Dynamic import to keep ethers out of the main bundle
    import('@/hooks/wallets/web3').then(({ createWeb3ReadOnly }) => {
      const web3ReadOnly = createWeb3ReadOnly(chain, customRpcUrl)
      setWeb3ReadOnly(web3ReadOnly)
    })
  }, [chain, customRpcUrl])
}
