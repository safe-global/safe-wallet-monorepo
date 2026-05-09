import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'

/**
 * Extracts the safeTxHash from transaction details.
 * The safeTxHash is the hash of the transaction struct without signatures,
 * and should be present in the detailedExecutionInfo for multisig transactions.
 *
 * @param txDetails - Transaction details from the gateway API
 * @returns The safeTxHash if available, null otherwise
 */
export const getSafeTxHashFromDetails = (txDetails: TransactionDetails): string | null => {
  if (!isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)) {
    return null
  }

  const safeTxHash = txDetails.detailedExecutionInfo.safeTxHash

  // Return the hash if it exists and is not empty
  return safeTxHash || null
}
