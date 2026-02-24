import type { TransactionDetails, ProposeTransactionDto } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { Operation } from '@safe-global/store/gateway/types'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { AppDispatch } from '@/src/store'
import { asError } from '@safe-global/utils/services/exceptions/utils'

interface ProposeNewTransactionParams {
  chainId: string
  safeAddress: string
  sender: string
  signedTx: SafeTransaction
  safeTxHash: string
  dispatch: AppDispatch
  origin?: string
}

const proposeNewTransaction = async ({
  chainId,
  safeAddress,
  sender,
  signedTx,
  safeTxHash,
  dispatch,
  origin,
}: ProposeNewTransactionParams): Promise<TransactionDetails> => {
  const signatures = signedTx.signatures.size > 0 ? signedTx.encodedSignatures() : undefined

  const proposeTransactionDto: ProposeTransactionDto = {
    to: signedTx.data.to,
    value: signedTx.data.value?.toString() ?? '0',
    data: signedTx.data.data || undefined,
    nonce: signedTx.data.nonce.toString(),
    operation: signedTx.data.operation as unknown as Operation,
    safeTxGas: signedTx.data.safeTxGas?.toString() ?? '0',
    baseGas: signedTx.data.baseGas?.toString() ?? '0',
    gasPrice: signedTx.data.gasPrice?.toString() ?? '0',
    gasToken: signedTx.data.gasToken,
    refundReceiver: signedTx.data.refundReceiver,
    safeTxHash,
    sender,
    signature: signatures,
    origin,
  }

  const result = await dispatch(
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

export default proposeNewTransaction
