import { isAddress, getAddress } from 'ethers'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { createTx } from '@/src/services/tx/tx-sender/create'
import proposeNewTransaction from '@/src/services/tx/proposeNewTransaction'
import { createErc20TransferParams } from './tokenTransferParams'
import type { SendTransactionParams } from '../types'
import type { AppDispatch } from '@/src/store'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

interface CreateSendTransactionArgs extends SendTransactionParams {
  dispatch: AppDispatch
}

/**
 * Validates inputs, builds a SafeTransaction, signs it, and proposes to CGW.
 * Returns the transaction details ID on success.
 */
export const createSendTransaction = async ({
  recipient,
  tokenAddress,
  amount,
  decimals,
  chainId,
  safeAddress,
  sender,
  dispatch,
}: CreateSendTransactionArgs): Promise<string> => {
  if (!isAddress(recipient)) {
    throw new Error(`Invalid recipient address: ${recipient}`)
  }
  if (!isAddress(tokenAddress)) {
    throw new Error(`Invalid token address: ${tokenAddress}`)
  }

  const parsedAmount = safeParseUnits(amount, decimals)
  if (parsedAmount === undefined) {
    throw new Error(`Failed to parse amount "${amount}" with ${decimals} decimals`)
  }

  const isNative = sameAddress(tokenAddress, ZERO_ADDRESS)
  const txData = isNative
    ? { to: getAddress(recipient), value: parsedAmount.toString(), data: '0x' }
    : createErc20TransferParams(getAddress(recipient), getAddress(tokenAddress), parsedAmount.toString())

  const safeTx = await createTx(txData)

  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK is not initialized')
  }

  const sdkChainId = await safeSDK.getChainId()
  if (sdkChainId.toString() !== chainId) {
    throw new Error(`Chain mismatch: SDK on chain ${sdkChainId}, expected ${chainId}`)
  }

  const signedTx = await safeSDK.signTransaction(safeTx)
  const safeTxHash = await safeSDK.getTransactionHash(signedTx)

  const txDetails = await proposeNewTransaction({
    chainId,
    safeAddress,
    sender,
    signedTx,
    safeTxHash,
    dispatch,
  })

  return txDetails.txId
}
