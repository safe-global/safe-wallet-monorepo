import useSuperChainAccount from './useSuperChainAccount'
import useWallet from '../wallets/useWallet'
import { zeroAddress } from 'viem'
import { useQuery } from '@tanstack/react-query'

function useCurrentWalletHasSuperChainSmartAccount() {
  const wallet = useWallet()
  const { getReadOnlySuperChainSmartAccount } = useSuperChainAccount()
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['checkSuperAccount'],
    queryFn: async () => {
      if (!wallet?.address) return
      const SuperChainAccountContractReadOnly = getReadOnlySuperChainSmartAccount()
      const { smartAccount } = await SuperChainAccountContractReadOnly.getUserSuperChainAccount(wallet.address)
      return {
        hasSuperChainSmartAccount: smartAccount !== zeroAddress,
        superChainSmartAccount: smartAccount,
      }
    },
    enabled: !!wallet?.address,
  })

  return { ...data, isLoading, refetch, isRefetching }
}

export default useCurrentWalletHasSuperChainSmartAccount
