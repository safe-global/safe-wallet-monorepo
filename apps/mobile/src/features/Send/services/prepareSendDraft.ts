import { getAddress, isAddress } from 'ethers'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { createTx } from '@/src/services/tx/tx-sender/create'
import { getVerifiedSafeSDK, previewAndStashDraft } from '@/src/services/tx/draft'
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

/**
 * Builds a token-transfer SafeTransaction and runs the shared draft pipeline (see
 * previewAndStashDraft). Returns the safeTxHash used as the downstream txId.
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

  return previewAndStashDraft({ safeSDK, safeTx, chainId, safeAddress, safe, dispatch })
}
