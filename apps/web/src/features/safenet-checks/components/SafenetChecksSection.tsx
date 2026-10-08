import { useContext, type ReactElement } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import useSafeInfo from '@/hooks/useSafeInfo'
import { resolvePresentation } from '../statusPresentation'
import { SafenetChecksSectionView } from '@views/features/safenet-checks/components/SafenetChecksSectionView'

/**
 * Safenet check state as a section in the Safe Shield widget. Subscribes only
 * for confirm/execute flows of an already-proposed transaction, and only once
 * the submission time is known — `submittedAt` is the transaction's submission
 * date, the aim the shared read window wants.
 */
export const SafenetChecksSection = (): ReactElement | null => {
  const { txId, txDetails } = useContext(TxFlowContext)
  const safeTxHash = txId ? getSafeTxHashFromTxId(txId) : undefined
  const submittedAt =
    txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
      ? txDetails.detailedExecutionInfo.submittedAt
      : undefined

  const { safe, safeAddress } = useSafeInfo()
  const { publicStatus, snapshot, unavailableReason } = useSafenetCheck(
    submittedAt !== undefined ? safeTxHash : undefined,
    submittedAt,
    { chainId: safe.chainId, safeAddress },
  )

  const content = resolvePresentation(publicStatus, unavailableReason, snapshot !== undefined)
  if (!content) return null

  return (
    <SafenetChecksSectionView
      status={publicStatus}
      reason={unavailableReason}
      severity={content.severity}
      muted={content.muted}
      label={content.label}
      copy={content.copy}
    />
  )
}

export default SafenetChecksSection
