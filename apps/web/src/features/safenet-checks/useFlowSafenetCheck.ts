import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafenetCheck, type SafenetCheckView } from '@safe-global/utils/features/safenet-checks/hooks'

export type FlowSafenetCheck = {
  safeTxHash: string | undefined
  submittedAt: number | undefined
  check: SafenetCheckView
}

/**
 * The check of the transaction open in the tx flow. Reads only once a proposed transaction's
 * submission time is known; every caller shares one cache entry and one chain read.
 */
export const useFlowSafenetCheck = (enabled = true): FlowSafenetCheck => {
  const { txId, txDetails } = useContext(TxFlowContext)
  const safeTxHash = txId ? getSafeTxHashFromTxId(txId) : undefined
  const submittedAt =
    txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
      ? txDetails.detailedExecutionInfo.submittedAt
      : undefined

  const { safe, safeAddress } = useSafeInfo()
  const check = useSafenetCheck(enabled && submittedAt !== undefined ? safeTxHash : undefined, submittedAt, {
    chainId: safe.chainId,
    safeAddress,
  })

  return { safeTxHash, submittedAt, check }
}
