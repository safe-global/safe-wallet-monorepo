import { OperationType, type MetaTransactionData } from '@safe-global/types-kit'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { DraftTx } from '@/src/store/draftTxSlice'
import type { AppDispatch } from '@/src/store'
import { getVerifiedSafeSDK, previewAndStashDraft } from './draft'

export type RebuildDraftWithNonceArgs = {
  draft: DraftTx
  newNonce: number
  safe: Pick<SafeState, 'owners' | 'threshold'>
  dispatch: AppDispatch
}

/**
 * Re-hashes the draft SafeTransaction under a new nonce and re-runs the draft pipeline,
 * returning the new safeTxHash. A single MetaTransactionData passes through
 * createTransaction as-is, so an encoded multiSend keeps its delegate call operation.
 */
export const rebuildDraftWithNonce = async ({
  draft,
  newNonce,
  safe,
  dispatch,
}: RebuildDraftWithNonceArgs): Promise<string> => {
  const { to, value, data, operation } = draft.buildParams
  if (!to) {
    throw new Error('Draft transaction has no target to rebuild')
  }

  const transaction: MetaTransactionData = {
    to,
    value: value ?? '0',
    data: data ?? '0x',
    operation: operation ?? OperationType.Call,
  }

  const safeSDK = await getVerifiedSafeSDK(draft.chainId)
  const safeTx = await safeSDK.createTransaction({
    transactions: [transaction],
    options: { nonce: newNonce },
  })

  return previewAndStashDraft({
    safeSDK,
    safeTx,
    chainId: draft.chainId,
    safeAddress: draft.safeAddress,
    safe,
    dispatch,
  })
}
