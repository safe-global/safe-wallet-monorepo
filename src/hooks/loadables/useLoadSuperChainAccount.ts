import type { SuperChainAccount } from '@/types/super-chain'
import type { AsyncResult } from '../useAsync'
import useSuperChainAccount from '../super-chain/useSuperChainAccount'
import useSafeInfo from '../useSafeInfo'
import { useQuery } from '@tanstack/react-query'

export const useLoadSuperChainAccount = (): AsyncResult<SuperChainAccount> => {
  const { safe } = useSafeInfo()
  const { address } = safe
  const { getReadOnlySuperChainSmartAccount } = useSuperChainAccount()
  const SuperChainAccountContractReadOnly = getReadOnlySuperChainSmartAccount()
  const { data, isLoading, error } = useQuery<SuperChainAccount>({
    queryKey: ['superChainAccount', address.value],
    queryFn: async () => {
      const response = await SuperChainAccountContractReadOnly.getSuperChainAccount(address.value)
      return {
        smartAccount: response[0],
        superChainID: response[1],
        points: response[2],
        level: response[3],
        noun: response[4],
      }
    },
  })
  console.debug({ data, isLoading, error })
  return [data, error!, isLoading]
}
