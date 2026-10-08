import type { ModuleTransaction, MultisigTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { SwapFeature, useIsExpiredSwap } from '@/features/swap'
import type { ReactElement } from 'react'

import DateTime from '@/components/common/DateTime'
import TxInfo from '@/components/transactions/TxInfo'
import { isMultisigExecutionInfo, isTxQueued } from '@/utils/transaction-guards'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import { isImitation, isTrustedTx } from '@/utils/transactions'
import QueueActions from './QueueActions'
import { TxSummaryView } from '@views/components/transactions/TxSummary/TxSummaryView'
import useIsPending from '@/hooks/useIsPending'
import { useHasFeature } from '@/hooks/useChains'
import TxStatusLabel from '@/components/transactions/TxStatusLabel'
import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  useHnQueueAssessmentResult,
  useShowHypernativeAssessment,
  useHypernativeOAuth,
  HypernativeFeature,
} from '@/features/hypernative'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
import { SafenetChecksFeature, useIsSafenetChecksEnabled } from '@/features/safenet-checks'
import { useLoadFeature } from '@/features/__core__/useLoadFeature'

type TxSummaryProps = {
  isConflictGroup?: boolean
  isBulkGroup?: boolean
  item: ModuleTransaction | MultisigTransaction
}

const TxSummary = ({ item, isConflictGroup, isBulkGroup }: TxSummaryProps): ReactElement => {
  const { StatusLabel } = useLoadFeature(SwapFeature)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)
  const { HnQueueAssessment } = useLoadFeature(HypernativeFeature)
  const { SafenetQueueStatus } = useLoadFeature(SafenetChecksFeature)
  const isSafenetEnabled = useIsSafenetChecksEnabled()

  const tx = item.transaction
  const isQueue = isTxQueued(tx.txStatus)
  const nonce = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined
  const isTrusted = !hasDefaultTokenlist || isTrustedTx(tx)
  const isImitationTransaction = isImitation(tx)
  const showWarning = isImitationTransaction || !isTrusted
  const isPending = useIsPending(tx.id)
  const executionInfo = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo : undefined
  const expiredSwap = useIsExpiredSwap(tx.txInfo)

  // Extract safeTxHash for assessment
  const safeTxHash = tx.id ? getSafeTxHashFromTxId(tx.id) : undefined
  const assessment = useHnQueueAssessmentResult(safeTxHash)
  const { isAuthenticated } = useHypernativeOAuth()
  const showAssessment = useShowHypernativeAssessment() && isQueue
  // Bulk-group rows hide the cell via CSS; skipping the mount also skips the chain read.
  const showSafenetStatus = isSafenetEnabled && isQueue && !isBulkGroup && !!safeTxHash

  return (
    <TxSummaryView
      id={tx.id}
      isQueue={isQueue}
      isConflictGroup={isConflictGroup}
      isBulkGroup={isBulkGroup}
      showWarning={showWarning}
      isImitationTransaction={isImitationTransaction}
      showAssessment={showAssessment}
      showSafenetStatus={showSafenetStatus}
      isPending={isPending}
      expiredSwap={expiredSwap}
      nonce={nonce}
      note={tx.note}
      date={<DateTime value={tx.timestamp} />}
      confirmations={
        executionInfo
          ? { submitted: executionInfo.confirmationsSubmitted, required: executionInfo.confirmationsRequired }
          : undefined
      }
      typeIcon={<TxTypeIcon tx={tx} />}
      typeText={<TxTypeText tx={tx} />}
      txInfo={<TxInfo info={tx.txInfo} />}
      assessment={
        safeTxHash ? (
          <HnQueueAssessment safeTxHash={safeTxHash} assessment={assessment} isAuthenticated={isAuthenticated} />
        ) : undefined
      }
      safenetStatus={safeTxHash ? <SafenetQueueStatus safeTxHash={safeTxHash} timestampMs={tx.timestamp} /> : undefined}
      statusLabel={<TxStatusLabel tx={tx} />}
      queueActions={<QueueActions tx={tx} />}
      renderSwapStatusLabel={(status) => <StatusLabel status={status} />}
    />
  )
}

export default TxSummary
