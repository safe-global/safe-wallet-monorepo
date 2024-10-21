import { type Palette } from '@mui/material'
import { Box, CircularProgress, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import { type Transaction, TransactionStatus } from '@safe-global/safe-gateway-typescript-sdk'

import DateTime from '@/components/common/DateTime'
import TxInfo from '@/components/transactions/TxInfo'
import SignTxButton from '@/components/transactions/SignTxButton'
import ExecuteTxButton from '@/components/transactions/ExecuteTxButton'
import css from './styles.module.css'
import useWallet from '@/hooks/wallets/useWallet'
import { isAwaitingExecution, isMultisigExecutionInfo, isTxQueued } from '@/utils/transaction-guards'
import RejectTxButton from '@/components/transactions/RejectTxButton'
import useTransactionStatus from '@/hooks/useTransactionStatus'
import TxType from '@/components/transactions/TxType'
import TxConfirmations from '../TxConfirmations'
import useIsPending from '@/hooks/useIsPending'
import classNames from 'classnames'
import { isTrustedTx } from '@/utils/transactions'
import UntrustedTxWarning from '../UntrustedTxWarning'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'

const getStatusColor = (value: TransactionStatus, palette: Palette | Record<string, Record<string, string>>) => {
  switch (value) {
    case TransactionStatus.SUCCESS:
      return palette.success.main
    case TransactionStatus.FAILED:
    case TransactionStatus.CANCELLED:
      return palette.error.main
    case TransactionStatus.AWAITING_CONFIRMATIONS:
    case TransactionStatus.AWAITING_EXECUTION:
      return palette.warning.main
    default:
      return palette.primary.main
  }
}

type TxSummaryProps = {
  isGrouped?: boolean
  item: Transaction
}

const TxSummary = ({ item, isGrouped }: TxSummaryProps): ReactElement => {
  // safeSDK stuff
  // const safeSDK = useSafeSDK()

  const tx = item.transaction
  const wallet = useWallet()
  const txStatusLabel = useTransactionStatus(tx)
  const isPending = useIsPending(tx.id)
  const isQueue = isTxQueued(tx.txStatus)
  const awaitingExecution = isAwaitingExecution(tx.txStatus)
  const nonce = isMultisigExecutionInfo(tx.executionInfo) ? tx.executionInfo.nonce : undefined
  const requiredConfirmations = isMultisigExecutionInfo(tx.executionInfo)
    ? tx.executionInfo.confirmationsRequired
    : undefined
  const submittedConfirmations = isMultisigExecutionInfo(tx.executionInfo)
    ? tx.executionInfo.confirmationsSubmitted
    : undefined

  const displayConfirmations = isQueue && !!submittedConfirmations && !!requiredConfirmations

  const isTrusted = isTrustedTx(tx)

  classNames(css.gridContainer, isQueue ? css.columnTemplate : css.columnTemplateTxHistory)

  return (
    <Box
      data-testid="transaction-item"
      className={classNames(css.gridContainer, isQueue ? css.columnTemplate : css.columnTemplateTxHistory, {})}
      id={tx.id}
    >
      {!isTrusted && (
        <Box data-testid="warning" gridArea="nonce">
          <UntrustedTxWarning />
        </Box>
      )}

      {nonce && !isGrouped && (
        <Box data-testid="nonce" gridArea="nonce">
          {nonce}
        </Box>
      )}

      <Box
        data-testid="tx-type"
        gridArea="type"
        className={classNames(css.columnWrap, { [css.untrusted]: !isTrusted })}
      >
        <TxType tx={tx} />
      </Box>

      <Box
        data-testid="tx-info"
        gridArea="info"
        className={classNames(css.columnWrap, { [css.untrusted]: !isTrusted })}
      >
        <TxInfo info={tx.txInfo} />
      </Box>

      <Box data-testid="tx-date" gridArea="date" className={classNames({ [css.untrusted]: !isTrusted })}>
        <DateTime value={tx.timestamp} />
      </Box>

      {displayConfirmations && (
        <Box
          gridArea="confirmations"
          display="flex"
          alignItems="center"
          gap={1}
          className={classNames({ [css.untrusted]: !isTrusted })}
        >
          <TxConfirmations
            submittedConfirmations={submittedConfirmations}
            requiredConfirmations={requiredConfirmations}
          />
        </Box>
      )}

      {wallet && isQueue && (
        <Box
          gridArea="actions"
          display="flex"
          justifyContent={{ sm: 'center' }}
          gap={1}
          className={classNames({ [css.untrusted]: !isTrusted })}
        >
          {awaitingExecution ? (
            <ExecuteTxButton txSummary={item.transaction} compact />
          ) : (
            <SignTxButton txSummary={item.transaction} compact />
          )}
          <RejectTxButton txSummary={item.transaction} compact />
        </Box>
      )}

      <Box
        data-testid="tx-status"
        gridArea="status"
        marginLeft={{ sm: 'auto' }}
        marginRight={1}
        display="flex"
        alignItems="center"
        gap={1}
        color={({ palette }) => getStatusColor(tx.txStatus, palette)}
        className={classNames({ [css.untrusted]: !isTrusted })}
      >
        {isPending && <CircularProgress size={14} color="inherit" />}

        <Typography variant="caption" fontWeight="bold" color={({ palette }) => getStatusColor(tx.txStatus, palette)}>
          {txStatusLabel}
        </Typography>
      </Box>
    </Box>
  )
}

export default TxSummary
