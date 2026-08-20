import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { getStoreInstance } from '@/store'
import { asError } from '@safe-global/utils/services/exceptions/utils'

/**
 * Submit a confirmation (signature) for an existing transaction to the Safe Client Gateway.
 *
 * Gateway-native equivalent of api-kit's `confirmTransaction`. Used to attach a parent Safe's
 * pre-validated approval (`generatePreValidatedSignature(parentAddress)`) to a child Safe's
 * transaction after the parent's on-chain `approveHash` has been relayed and mined.
 */
const addConfirmation = async (chainId: string, safeTxHash: string, signature: string): Promise<Transaction> => {
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

export default addConfirmation
