import { useAppSelector } from '@/src/store/hooks'
import { selectSigningState } from '@/src/store/signingStateSlice'

/**
 * Hook to get the signing state for a specific transaction.
 *
 * Returns the signing status and metadata from the global Redux store.
 * This hook provides a simple interface to check if a transaction is currently being signed.
 *
 * @param txId - The transaction ID to check signing status for
 * @returns Signing state including isSigning, isSuccess, isError, error, and timestamps
 */
export function useTransactionSigningState(txId: string) {
  const signing = useAppSelector((state) => selectSigningState(state, txId))

  return {
    isSigning: signing?.status === 'signing',
    isSuccess: signing?.status === 'success',
    isError: signing?.status === 'error',
    error: signing?.error,
    startedAt: signing?.startedAt,
    completedAt: signing?.completedAt,
  }
}
