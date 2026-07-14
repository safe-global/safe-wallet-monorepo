import { cgwApi, type Operation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { clearDraft, setDraft, setDraftRedirect, type DraftTx } from '@/src/store/draftTxSlice'
import { rekeyOutstandingRequest } from '@/src/features/WalletConnect/Wallet/store/walletKitSlice'
import { synthesizeDraftTxDetails } from '@/src/features/ConfirmTx/utils/synthesizeDraftTxDetails'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { AppDispatch } from '@/src/store'

type SafeSDK = NonNullable<ReturnType<typeof getSafeSDK>>

/**
 * The protocol-kit SDK singleton, verified bound to `chainId` — throws on a mismatch rather than
 * composing a draft for the wrong chain.
 */
export async function getVerifiedSafeSDK(chainId: string): Promise<SafeSDK> {
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

export type PreviewAndStashDraftArgs = {
  safeSDK: SafeSDK
  safeTx: SafeTransaction
  chainId: string
  safeAddress: string
  safe: Pick<SafeState, 'owners' | 'threshold'>
  dispatch: AppDispatch
}

/**
 * Shared draft pipeline: hash the SafeTransaction, fetch a CGW /preview, synthesize details and
 * stash a DraftTx so the review screens render without /propose (which only runs on sign).
 * Throws without stashing if the preview fails. Returns the safeTxHash (the synthetic txId).
 */
export const previewAndStashDraft = async ({
  safeSDK,
  safeTx,
  chainId,
  safeAddress,
  safe,
  dispatch,
}: PreviewAndStashDraftArgs): Promise<string> => {
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

/** After a rebuild: hands everything keyed by the old hash over to the new draft and drops the old entry */
export const redirectDraft = (dispatch: AppDispatch, fromSafeTxHash: string, toSafeTxHash: string): void => {
  if (fromSafeTxHash === toSafeTxHash) {
    return
  }
  dispatch(rekeyOutstandingRequest({ fromSafeTxHash, toSafeTxHash }))
  dispatch(setDraftRedirect({ fromSafeTxHash, toSafeTxHash }))
  dispatch(clearDraft(fromSafeTxHash))
}
