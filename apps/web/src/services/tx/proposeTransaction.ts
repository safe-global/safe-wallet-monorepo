import type {
  TransactionDetails,
  ProposeTransactionDto,
  Operation,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getStoreInstance } from '@/store'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { NestedTxEnvelope } from './nestedTxEnvelope'

/**
 * Child tx of a nested approveHash, proposed alongside the parent tx so the service learns
 * about it without a proposal from the child Safe. The generated `ProposeTransactionDto` does
 * not include the field yet — replace this with the generated type once the CGW schema ships it.
 */
export type NestedTransactionDto = {
  to: string
  value: string
  data?: string | null
  operation: Operation
  safeTxGas: string
  baseGas: string
  gasPrice: string
  gasToken: string
  refundReceiver?: string | null
  nonce: string
  notes?: string | null
}

const toNestedTransactionDto = (envelope: NestedTxEnvelope): NestedTransactionDto => ({
  to: envelope.to,
  value: envelope.value,
  data: envelope.data || undefined,
  operation: envelope.operation as Operation,
  safeTxGas: envelope.safeTxGas,
  baseGas: envelope.baseGas,
  gasPrice: envelope.gasPrice,
  gasToken: envelope.gasToken,
  refundReceiver: envelope.refundReceiver,
  nonce: String(envelope.nonce),
})

const proposeTx = async (
  chainId: string,
  safeAddress: string,
  sender: string,
  tx: SafeTransaction,
  safeTxHash: string,
  origin?: string,
  nestedTransaction?: NestedTxEnvelope,
): Promise<TransactionDetails> => {
  const signatures = tx.signatures.size > 0 ? tx.encodedSignatures() : undefined

  const proposeTransactionDto: ProposeTransactionDto & { nestedTransaction?: NestedTransactionDto } = {
    to: tx.data.to,
    value: tx.data.value?.toString() ?? '0',
    data: tx.data.data || undefined,
    nonce: tx.data.nonce.toString(),
    operation: tx.data.operation as Operation,
    safeTxGas: tx.data.safeTxGas?.toString() ?? '0',
    baseGas: tx.data.baseGas?.toString() ?? '0',
    gasPrice: tx.data.gasPrice?.toString() ?? '0',
    gasToken: tx.data.gasToken,
    refundReceiver: tx.data.refundReceiver,
    safeTxHash,
    sender,
    signature: signatures,
    origin,
    ...(nestedTransaction && { nestedTransaction: toNestedTransactionDto(nestedTransaction) }),
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
