import { CHAIN_ID } from '@/features/superChain/constants'
import useChainId from '@/hooks/useChainId'
import useWallet from '@/hooks/wallets/useWallet'

const useIsWrongChain = (): boolean => {
  const chainId = useChainId()
  const wallet = useWallet()
  return !wallet || !chainId ? false : wallet.chainId !== CHAIN_ID
}

export default useIsWrongChain
