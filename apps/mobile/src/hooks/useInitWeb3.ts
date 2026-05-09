import { useEffect } from 'react'
import { createWeb3ReadOnly, setWeb3ReadOnly } from '@/src/hooks/wallets/web3'
import { selectRpc } from '@/src/store/settingsSlice'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'

export const useInitWeb3 = () => {
  const chain = useAppSelector(selectActiveChain)
  const customRpc = useAppSelector(selectRpc)
  const customRpcUrl = chain ? customRpc?.[chain.chainId] : undefined

  useEffect(() => {
    if (!chain) {
      setWeb3ReadOnly(undefined)
      return
    }
    const web3ReadOnly = createWeb3ReadOnly(chain, customRpcUrl)
    setWeb3ReadOnly(web3ReadOnly)
  }, [chain, customRpcUrl])
}
