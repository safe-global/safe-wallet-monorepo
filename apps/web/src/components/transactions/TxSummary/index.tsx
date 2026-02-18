import type { ModuleTransaction, MultisigTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import TxProposalChip from '@/features/proposers/components/TxProposalChip'
import StatusLabel from '@/features/swap/components/StatusLabel'
import useIsExpiredSwap from '@/features/swap/hooks/useIsExpiredSwap'
import { Box, Typography } from '@mui/material'
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
    <Box
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
        <Box data-testid="nonce" className={css.nonce} gridArea="nonce">
          {nonce}
        </Box>
      )}

      {(isImitationTransaction || !isTrusted) && (
        <Box data-testid="warning" gridArea="nonce">
          <MaliciousTxWarning withTooltip={!isImitationTransaction} />
        </Box>
      )}

      <Box data-testid="tx-type" gridArea="type">
        <TxType tx={tx} />

        {tx.note && (
          <Typography variant="body2" component="span" color="text.secondary" title={tx.note}>
            {ellipsis(tx.note, 25)}
          </Typography>
        )}
      </Box>

      <Box data-testid="tx-info" gridArea="info">
        <TxInfo info={tx.txInfo} />
      </Box>

      <Box data-testid="tx-date" className={css.date} gridArea="date">
        <DateTime value={tx.timestamp} />
      </Box>

      {isQueue && executionInfo && (
        <Box gridArea="confirmations">
          {executionInfo.confirmationsSubmitted > 0 || isPending ? (
            <TxConfirmations
              submittedConfirmations={executionInfo.confirmationsSubmitted}
              requiredConfirmations={executionInfo.confirmationsRequired}
            />
          ) : (
            <TxProposalChip />
          )}
        </Box>
      )}

      {showAssessment && safeTxHash && (
        <Box gridArea="assessment" className={css.assessment}>
          <HnQueueAssessment safeTxHash={safeTxHash} assessment={assessment} isAuthenticated={isAuthenticated} />
        </Box>
      )}

      {(!isQueue || expiredSwap || isPending) && (
        <Box className={css.status} gridArea="status">
          {isQueue && expiredSwap ? <StatusLabel status="expired" /> : <TxStatusLabel tx={tx} />}
        </Box>
      )}

      {isQueue && !expiredSwap && (
        <Box gridArea="actions">
          <QueueActions tx={tx} />
        </Box>
      )}
    </Box>
  )
}

export default TxSummary
