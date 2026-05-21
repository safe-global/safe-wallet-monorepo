import { getAddress, isAddress } from 'ethers'
import { cgwApi, type Operation } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { createTx } from '@/src/services/tx/tx-sender/create'
import { setDraft, type DraftTx } from '@/src/store/draftTxSlice'
import { synthesizeDraftTxDetails } from '@/src/features/ConfirmTx/utils/synthesizeDraftTxDetails'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { createTokenTransferParams } from './tokenTransferParams'
import type { SendTransactionParams } from '../types'
import type { AppDispatch } from '@/src/store'

interface PrepareSendDraftArgs extends Omit<SendTransactionParams, 'sender'> {
  dispatch: AppDispatch
  nonce?: number
  safe: SafeState
}

function validateAddresses(recipient: string, tokenAddress: string): void {
  if (!isAddress(recipient)) {
    throw new Error(`Invalid recipient address: ${recipient}`)
  }
  if (!isAddress(tokenAddress)) {
    throw new Error(`Invalid token address: ${tokenAddress}`)
  }
}

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
 * Validates inputs, builds a SafeTransaction locally, asks CGW for a
 * preview, and stashes a draft so the existing sign/review screens can
 * render it without a CGW round-trip via /propose. The actual /propose
 * call only happens when the user signs — the signer at sign time
 * becomes the proposer recorded by CGW.
 *
 * Returns the `safeTxHash` (used as the synthetic txId for the
 * downstream review screens).
 */
export const prepareSendDraft = async ({
  recipient,
  tokenAddress,
  amount,
  decimals,
  chainId,
  safeAddress,
  dispatch,
  nonce,
  safe,
}: PrepareSendDraftArgs): Promise<string> => {
  validateAddresses(recipient, tokenAddress)

  const safeSDK = await getVerifiedSafeSDK(chainId)
  const txData = createTokenTransferParams(getAddress(recipient), amount, decimals, getAddress(tokenAddress))
  const safeTx = await createTx(txData, nonce)
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
