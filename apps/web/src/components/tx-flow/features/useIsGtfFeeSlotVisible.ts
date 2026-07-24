import { useContext } from 'react'
import { useIsGtfSlotVisible } from '@/features/gtf'
import { SafeTxContext } from '../SafeTxProvider'
import { decodeNestedApproval } from '@/services/tx/confirmNestedApproval'

/**
 * Visibility for the GTF fee slots (fee preview + fee banner) in the tx flow.
 *
 * Shows on GTF chains, EXCEPT for a nested parent approveHash: that tx is zero-fee and the
 * user picks relay vs. EOA execution, so a "fees paid from the signer" block would be misleading.
 */
export const useIsGtfFeeSlotVisible = (): boolean => {
  const isGtfVisible = useIsGtfSlotVisible()
  const { safeTx } = useContext(SafeTxContext)
  const isNestedApproveHash = !!safeTx && !!decodeNestedApproval(safeTx)

  return isGtfVisible && !isNestedApproveHash
}
