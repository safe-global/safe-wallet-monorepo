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
 * Validates inputs, builds a token-transfer SafeTransaction locally, then runs the shared
 * draft pipeline (CGW /preview → synthesized details → stashed DraftTx) so the existing
 * sign/review screens can render it without a CGW round-trip via /propose. The actual
 * /propose call only happens when the user signs — the signer at sign time becomes the
 * proposer recorded by CGW.
 *
 * Returns the `safeTxHash` (used as the synthetic txId for the downstream review screens).
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
