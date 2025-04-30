import { getTransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import useAsync from '@safe-global/utils/hooks/useAsync'
import useChainId from './useChainId'

function useTxDetails(txId?: string) {
  const chainId = useChainId()

  return useAsync(() => {
    if (!txId) return
    return getTransactionDetails(chainId, txId)
  }, [chainId, txId])
}

export default useTxDetails
