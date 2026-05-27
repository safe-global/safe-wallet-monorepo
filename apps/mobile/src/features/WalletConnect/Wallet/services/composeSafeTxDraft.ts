import { type Operation, cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { MetaTransactionData } from '@safe-global/types-kit'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { setDraft, type DraftTx } from '@/src/store/draftTxSlice'
import { synthesizeDraftTxDetails } from '@/src/features/ConfirmTx/utils/synthesizeDraftTxDetails'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { AppDispatch } from '@/src/store'

export type DappCall = {
  to: string
  value?: string // hex or decimal string
  data?: string
}

export type ComposeSafeTxDraftInput = {
  calls: DappCall[] // single for eth_sendTransaction, batch for wallet_sendCalls
  chainId: string
  safeAddress: string
  safe: SafeState
  dispatch: AppDispatch
}

const toMetaTx = (call: DappCall): MetaTransactionData => ({
  to: call.to,
  value: call.value ?? '0',
  data: call.data ?? '0x',
  operation: 0, // OperationType.Call — protocol-kit numeric enum
})

async function getVerifiedSafeSDK(chainId: string) {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK is not initialized')
  }

  const sdkChainId = await safeSDK.getChainId()
  if (sdkChainId.toString() !== chainId) {
    throw new Error(`Chain mismatch: SDK on chain ${sdkChainId}, expected ${chainId}`)
  }

  return safeSDK
}

/**
 * Build a SafeTransaction from one or more dApp-supplied calls, ask CGW for a preview,
 * and stash a DraftTx so the existing review-and-confirm flow can render it without a
 * /propose round-trip. The /propose call happens when the user signs.
 *
 * For batches (calls.length > 1) the SDK auto-wraps via multiSend (DelegateCall).
 *
 * Returns the safeTxHash (used as the txId in downstream navigation).
 */
export const composeSafeTxDraft = async ({
  calls,
  chainId,
  safeAddress,
  safe,
  dispatch,
}: ComposeSafeTxDraftInput): Promise<string> => {
  if (calls.length === 0) {
    throw new Error('composeSafeTxDraft: empty calls array')
  }

  const safeSDK = await getVerifiedSafeSDK(chainId)
  const metaTxs: MetaTransactionData[] = calls.map(toMetaTx)
  const safeTx = await safeSDK.createTransaction({ transactions: metaTxs })
  const safeTxHash = await safeSDK.getTransactionHash(safeTx)

  const previewPromise = dispatch(
    cgwApi.endpoints.transactionsPreviewTransactionV1.initiate({
      chainId,
      safeAddress,
      previewTransactionDto: {
        to: safeTx.data.to,
        data: safeTx.data.data || null,
        value: safeTx.data.value?.toString() ?? '0',
        operation: (safeTx.data.operation ?? 0) as Operation,
      },
    }),
  )

  let txDetails
  try {
    const previewResult = await previewPromise

    if ('error' in previewResult || !previewResult.data) {
      throw asError('error' in previewResult ? previewResult.error : new Error('Preview unavailable'))
    }

    txDetails = synthesizeDraftTxDetails({
      safeAddress,
      safeTxHash,
      buildParams: safeTx.data,
      owners: safe.owners,
      threshold: safe.threshold,
      preview: previewResult.data,
    })
  } finally {
    previewPromise.reset()
  }

  const draft: DraftTx = {
    chainId,
    safeAddress,
    buildParams: safeTx.data,
    safeTxHash,
    txDetails,
  }

  dispatch(setDraft(draft))

  return safeTxHash
}
