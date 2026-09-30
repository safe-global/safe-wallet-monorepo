import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getStoreInstance } from '@/store'
import { asError } from '@safe-global/utils/services/exceptions/utils'

const confirmTx = async (chainId: string, safeTxHash: string, signature: string): Promise<TransactionDetails> => {
  const store = getStoreInstance()

  const result = await store.dispatch(
    cgwApi.endpoints.transactionsAddConfirmationV1.initiate({
      chainId,
      safeTxHash,
      addConfirmationDto: { signature },
    }),
  )

  if ('error' in result) {
    throw asError(result.error)
  }

  return result.data
}

export default confirmTx
