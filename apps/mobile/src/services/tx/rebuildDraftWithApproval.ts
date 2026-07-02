import { decodeMultiSendData } from '@safe-global/protocol-kit'
import { OperationType, type MetaTransactionData } from '@safe-global/types-kit'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import {
  MULTISEND_SIGNATURE_HASH,
  updateApprovalTxs,
  type ApprovalInfo,
} from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import type { DraftTx } from '@/src/store/draftTxSlice'
import type { AppDispatch } from '@/src/store'
import { getVerifiedSafeSDK, previewAndStashDraft } from './draft'

export type RebuildDraftWithApprovalArgs = {
  draft: DraftTx
  approval: ApprovalInfo
  /** New amount as a decimal string, or PSEUDO_APPROVAL_VALUES.UNLIMITED */
  newValue: string
  safe: Pick<SafeState, 'owners' | 'threshold'>
  dispatch: AppDispatch
}

/**
 * Rebuilds a stashed draft with one approval re-encoded to a new amount and
 * runs it through the shared draft pipeline (hash, /preview, stash). Returns
 * the new safeTxHash — the caller owns re-keying the outstanding WC request
 * and dropping the old draft, and must skip both when the hash is unchanged.
 */
export const rebuildDraftWithApproval = async ({
  draft,
  approval,
  newValue,
  safe,
  dispatch,
}: RebuildDraftWithApprovalArgs): Promise<string> => {
  const { to, value, data, nonce, operation } = draft.buildParams
  if (!to || !data) {
    throw new Error('Draft transaction has no calldata to update')
  }
  // updateApprovalTxs silently skips approvals without decimals — fail loudly
  // instead of stashing an unchanged draft that looks like a successful edit.
  if (!approval.tokenInfo) {
    throw new Error('Cannot re-encode the approval without token metadata')
  }

  const innerTxs: MetaTransactionData[] = data.startsWith(MULTISEND_SIGNATURE_HASH)
    ? decodeMultiSendData(data)
    : [{ to, value: value ?? '0', data, operation: operation ?? OperationType.Call }]

  const updatedTxs = updateApprovalTxs([newValue], [approval], innerTxs)
  // updateApprovalTxs drops the operation from re-encoded entries; restore it
  // from the original position (approve calls are always plain calls anyway).
  const transactions: MetaTransactionData[] = updatedTxs.map((tx, index) => ({
    to: tx.to,
    value: tx.value,
    data: tx.data,
    operation: innerTxs[index].operation ?? OperationType.Call,
  }))

  const safeSDK = await getVerifiedSafeSDK(draft.chainId)
  const safeTx = await safeSDK.createTransaction({
    transactions,
    // Keep the original nonce so the edit replaces the draft instead of queueing after it
    options: nonce !== undefined ? { nonce } : undefined,
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
