import { SafeTransaction, SafeTransactionData } from '@safe-global/types-kit'

/**
 * Type guard to check if data is a SafeTransactionData.
 */
export function isSafeTransactionData(data: unknown): data is SafeTransactionData {
  return (
    data != null &&
    typeof data === 'object' &&
    'to' in data &&
    'value' in data &&
    'data' in data &&
    'operation' in data &&
    'safeTxGas' in data &&
    'baseGas' in data &&
    'gasPrice' in data &&
    'gasToken' in data &&
    'refundReceiver' in data &&
    'nonce' in data
  )
}
/**
 * Type guard to check if data is a SafeTransaction.
 */
export function isSafeTransaction(data: unknown): data is SafeTransaction {
  return (
    data != null &&
    typeof data === 'object' &&
    'data' in data &&
    isSafeTransactionData(data.data) &&
    'signatures' in data
  )
}
