import type { TransactionDetails, ProposeTransactionDto } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Operation } from '@safe-global/store/gateway/types'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getStoreInstance } from '@/store'
import { asError } from '@safe-global/utils/services/exceptions/utils'

const proposeTx = async (
  chainId: string,
  safeAddress: string,
  sender: string,
  tx: SafeTransaction,
  safeTxHash: string,
  origin?: string,
): Promise<TransactionDetails> => {
  const signatures = tx.signatures.size > 0 ? tx.encodedSignatures() : undefined

  const proposeTransactionDto: ProposeTransactionDto = {
    to: tx.data.to,
    value: tx.data.value?.toString() ?? '0',
    data: tx.data.data || undefined,
    nonce: tx.data.nonce.toString(),
    operation: tx.data.operation as unknown as Operation,
    safeTxGas: tx.data.safeTxGas?.toString() ?? '0',
    baseGas: tx.data.baseGas?.toString() ?? '0',
    gasPrice: tx.data.gasPrice?.toString() ?? '0',
    gasToken: tx.data.gasToken,
    refundReceiver: tx.data.refundReceiver,
    safeTxHash,
    sender,
    signature: signatures,
    origin,
  }

  const store = getStoreInstance()

  const result = await store.dispatch(
    cgwApi.endpoints.transactionsProposeTransactionV1.initiate({
      chainId,
      safeAddress,
      proposeTransactionDto,
    }),
  )

  if ('error' in result) {
    throw asError(result.error)
  }

  return result.data
}

export default proposeTx
