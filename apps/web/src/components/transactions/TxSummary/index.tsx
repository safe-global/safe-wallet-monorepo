import type { ModuleTransaction, MultisigTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxProposalChip } from '@/features/proposers'
import { SwapFeature, useIsExpiredSwap } from '@/features/swap'
import { Typography } from '@/components/ui/typography'
import type { ReactElement } from 'react'

import css from './styles.module.css'
import DateTime from '@/components/common/DateTime'
import TxInfo from '@/components/transactions/TxInfo'
import { isMultisigExecutionInfo, isTxQueued } from '@/utils/transaction-guards'
import TxType from '@/components/transactions/TxType'
import classNames from 'classnames'
import { isImitation, isTrustedTx } from '@/utils/transactions'
import MaliciousTxWarning from '../MaliciousTxWarning'
import QueueActions from './QueueActions'
import useIsPending from '@/hooks/useIsPending'
import TxConfirmations from '../TxConfirmations'
import { useHasFeature } from '@/hooks/useChains'
import TxStatusLabel from '@/components/transactions/TxStatusLabel'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { ellipsis } from '@safe-global/utils/utils/formatters'
import {
  useHnQueueAssessmentResult,
  useShowHypernativeAssessment,
  useHypernativeOAuth,
  HypernativeFeature,
} from '@/features/hypernative'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
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

  const tx = item.transaction
  const isQueue = isTxQueued(tx.txStatus)
  const nonce = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined
  const isTrusted = !hasDefaultTokenlist || isTrustedTx(tx)
  const isImitationTransaction = isImitation(tx)
  const isPending = useIsPending(tx.id)
  const executionInfo = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo : undefined
  const expiredSwap = useIsExpiredSwap(tx.txInfo)

  // Extract safeTxHash for assessment
  const safeTxHash = tx.id ? getSafeTxHashFromTxId(tx.id) : undefined
  const assessment = useHnQueueAssessmentResult(safeTxHash)
  const { isAuthenticated } = useHypernativeOAuth()
  const showAssessment = useShowHypernativeAssessment() && isQueue

  return (
    <div
      data-testid="transaction-item"
      className={classNames(css.gridContainer, {
        [css.history]: !isQueue,
        [css.conflictGroup]: isConflictGroup,
        [css.bulkGroup]: isBulkGroup,
        [css.untrusted]: !isTrusted || isImitationTransaction,
        [css.withAssessment]: showAssessment,
      })}
      id={tx.id}
    >
      {nonce !== undefined && !isConflictGroup && !isBulkGroup && (
        <div data-testid="nonce" className={css.nonce} style={{ gridArea: 'nonce' }}>
          {nonce}
        </div>
      )}

      {(isImitationTransaction || !isTrusted) && (
        <div data-testid="warning" style={{ gridArea: 'nonce' }}>
          <MaliciousTxWarning withTooltip={!isImitationTransaction} />
        </div>
      )}

      <div data-testid="tx-type" style={{ gridArea: 'type' }}>
        <TxType tx={tx} />

        {tx.note && (
          <Typography variant="paragraph-small" className="text-[var(--color-text-secondary)]" title={tx.note}>
            {ellipsis(tx.note, 25)}
          </Typography>
        )}
      </div>

      <div data-testid="tx-info" style={{ gridArea: 'info' }}>
        <TxInfo info={tx.txInfo} />
      </div>

      <div data-testid="tx-date" className={css.date} style={{ gridArea: 'date' }}>
        <DateTime value={tx.timestamp} />
      </div>

      {isQueue && executionInfo && (
        <div style={{ gridArea: 'confirmations' }}>
          {executionInfo.confirmationsSubmitted > 0 || isPending ? (
            <TxConfirmations
              submittedConfirmations={executionInfo.confirmationsSubmitted}
              requiredConfirmations={executionInfo.confirmationsRequired}
            />
          ) : (
            <TxProposalChip />
          )}
        </div>
      )}

      {showAssessment && safeTxHash && (
        <div style={{ gridArea: 'assessment' }} className={css.assessment}>
          <HnQueueAssessment safeTxHash={safeTxHash} assessment={assessment} isAuthenticated={isAuthenticated} />
        </div>
      )}

      {(!isQueue || expiredSwap || isPending) && (
        <div className={css.status} style={{ gridArea: 'status' }}>
          {isQueue && expiredSwap ? <StatusLabel status="expired" /> : <TxStatusLabel tx={tx} />}
        </div>
      )}

      {isQueue && !expiredSwap && (
        <div style={{ gridArea: 'actions' }}>
          <QueueActions tx={tx} />
        </div>
      )}
    </div>
  )
}

export default TxSummary
