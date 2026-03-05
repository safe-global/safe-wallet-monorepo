import type {
  TransactionDetails,
  ProposeTransactionDto,
  Operation,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
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

function buildProposeDto(
  signedTx: SafeTransaction,
  safeTxHash: string,
  sender: string,
  origin?: string,
): ProposeTransactionDto {
  const signatures = signedTx.signatures.size > 0 ? signedTx.encodedSignatures() : undefined
  const { data } = signedTx

  return {
    to: data.to,
    value: data.value?.toString() ?? '0',
    data: data.data || undefined,
    nonce: data.nonce.toString(),
    operation: data.operation as Operation,
    safeTxGas: data.safeTxGas?.toString() ?? '0',
    baseGas: data.baseGas?.toString() ?? '0',
    gasPrice: data.gasPrice?.toString() ?? '0',
    gasToken: data.gasToken,
    refundReceiver: data.refundReceiver,
    safeTxHash,
    sender,
    signature: signatures,
    origin,
  }
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
  const proposeTransactionDto = buildProposeDto(signedTx, safeTxHash, sender, origin)

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
