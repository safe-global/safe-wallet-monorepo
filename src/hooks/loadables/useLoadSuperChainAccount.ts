import type { SuperChainAccount } from '@/types/super-chain'
import type { AsyncResult } from '../useAsync'
import useSuperChainAccount from '../super-chain/useSuperChainAccount'
import useSafeInfo from '../useSafeInfo'
import { zeroAddress } from 'viem'
import { useQuery } from '@tanstack/react-query'

export const useLoadSuperChainAccount = (): AsyncResult<SuperChainAccount> => {
  const { safe } = useSafeInfo()
  const { owners } = safe
  const { getReadOnlySuperChainSmartAccount } = useSuperChainAccount()
  const SuperChainAccountContractReadOnly = getReadOnlySuperChainSmartAccount()
  const { data, isLoading, error } = useQuery<SuperChainAccount>({
    queryKey: ['superChainAccount', owners[0]?.value],
    queryFn: async () => {
      const response = await SuperChainAccountContractReadOnly.superChainAccount(owners[0]?.value || zeroAddress)
      return {
        smartAccount: response[0],
        superChainID: response[1],
        points: response[2],
        level: response[3],
        noun: response[4],
      }
    },
  })
  console.debug({ data, error, isLoading })
  return [data, error!, isLoading]
}
