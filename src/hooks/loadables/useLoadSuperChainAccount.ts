import type { SuperChainAccount } from '@/types/super-chain'
import { zeroAddress } from 'viem'
import type { AsyncResult } from '../useAsync'
import useAsync from '../useAsync'

export const useLoadSuperChainAccount = (): AsyncResult<SuperChainAccount> => {
  const [data, error, loading] = useAsync<SuperChainAccount>(() => {
    return Promise.resolve({
      smartAccount: '0x1234',
      superChainID: 'js.superchain',
      points: BigInt(0),
      level: BigInt(1),
      eoas: [zeroAddress],
      noun: [BigInt(0)],
    })
  }, [])

  return [data, error, loading]
}
