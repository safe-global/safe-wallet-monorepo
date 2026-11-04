import type { ReactElement } from 'react'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { selectPinnedVerdict } from '@safe-global/store/safenet/safenetCheckSlice'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { Alert } from '@safe-global/views/components/ui/alert'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'

export type SafenetBatchWarningProps = {
  txs: ReadonlyArray<TransactionDetails> | undefined
}

/**
 * Counts the batched transactions Safenet flagged. The rows' own chips hold the reads, so this only
 * looks at the verdicts they pinned; it never opens a read of its own.
 */
const SafenetBatchWarning = ({ txs }: SafenetBatchWarningProps): ReactElement | null => {
  const { safe, safeAddress } = useSafeInfo()
  const flagged = useAppSelector(
    (state) =>
      (txs ?? []).filter(
        ({ detailedExecutionInfo }) =>
          isMultisigDetailedExecutionInfo(detailedExecutionInfo) &&
          selectPinnedVerdict(state, {
            safeTxHash: detailedExecutionInfo.safeTxHash,
            chainId: safe.chainId,
            safeAddress,
          })?.status === CheckStatus.MALICIOUS,
      ).length,
  )
  if (flagged === 0) return null

  return (
    <Alert variant="warning" outlined={false} className="mb-2" data-testid="safenet-batch-warning">
      Safenet flagged {flagged} of these transactions. Review {flagged === 1 ? 'it' : 'them'} before you execute.
    </Alert>
  )
}

export default SafenetBatchWarning
