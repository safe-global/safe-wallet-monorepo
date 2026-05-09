import { isAddress, getAddress } from 'ethers'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { createTx } from '@/src/services/tx/tx-sender/create'
import proposeNewTransaction from '@/src/services/tx/proposeNewTransaction'
import { createTokenTransferParams } from './tokenTransferParams'
import type { SendTransactionParams } from '../types'
import type { AppDispatch } from '@/src/store'

interface ProposeSendTransactionArgs extends SendTransactionParams {
  dispatch: AppDispatch
  nonce?: number
}

/**
 * Validates inputs, builds an unsigned SafeTransaction, and proposes
 * it to CGW without signing. Returns the transaction ID.
 *
 * The user will sign via the existing confirm-transaction flow.
 */
function validateAddresses(recipient: string, tokenAddress: string, sender: string): void {
  if (!isAddress(recipient)) {
    throw new Error(`Invalid recipient address: ${recipient}`)
  }
  if (!isAddress(tokenAddress)) {
    throw new Error(`Invalid token address: ${tokenAddress}`)
  }
  if (!isAddress(sender)) {
    throw new Error(`Invalid sender address: ${sender}`)
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

export const proposeSendTransaction = async ({
  recipient,
  tokenAddress,
  amount,
  decimals,
  chainId,
  safeAddress,
  sender,
  dispatch,
  nonce,
}: ProposeSendTransactionArgs): Promise<string> => {
  validateAddresses(recipient, tokenAddress, sender)

  const safeSDK = await getVerifiedSafeSDK(chainId)
  const txData = createTokenTransferParams(getAddress(recipient), amount, decimals, getAddress(tokenAddress))
  const safeTx = await createTx(txData, nonce)
  const safeTxHash = await safeSDK.getTransactionHash(safeTx)

  const txDetails = await proposeNewTransaction({
    chainId,
    safeAddress,
    sender: getAddress(sender),
    signedTx: safeTx,
    safeTxHash,
    dispatch,
  })

  return txDetails.txId
}
