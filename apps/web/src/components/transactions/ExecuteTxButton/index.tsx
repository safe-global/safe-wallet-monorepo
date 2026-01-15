import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useIsExpiredSwap from '@/features/swap/hooks/useIsExpiredSwap'
import useIsPending from '@/hooks/useIsPending'
import type { SyntheticEvent } from 'react'
import { type ReactElement, useContext } from 'react'
import { Button, Tooltip } from '@mui/material'

import useSafeInfo from '@/hooks/useSafeInfo'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import { gtmTrack } from '@/services/analytics/gtm'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import { ReplaceTxHoverContext } from '../GroupedTxListItems/ReplaceTxHoverProvider'
import CheckWallet from '@/components/common/CheckWallet'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { TxModalContext } from '@/components/tx-flow'
import { ConfirmTxFlow } from '@/components/tx-flow/flows'

const ExecuteTxButton = ({
  txSummary,
  compact = false,
}: {
  txSummary: Transaction
  compact?: boolean
}): ReactElement => {
  const { setTxFlow } = useContext(TxModalContext)
  const { safe } = useSafeInfo()
  const txNonce = isMultisigExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo.nonce : undefined
  const isPending = useIsPending(txSummary.id)
  const { setSelectedTxId } = useContext(ReplaceTxHoverContext)
  const safeSDK = useSafeSDK()

  const expiredSwap = useIsExpiredSwap(txSummary.txInfo)

  const isNext = txNonce !== undefined && txNonce === safe.nonce
  const isDisabled = !isNext || !safeSDK || expiredSwap || isPending

  const onClick = (e: SyntheticEvent) => {
    e.stopPropagation()
    e.preventDefault()
    // GA only - Mixpanel "Transaction Executed" is tracked in trackTxEvents() after actual execution
    gtmTrack(TX_LIST_EVENTS.EXECUTE)
    setTxFlow(<ConfirmTxFlow txSummary={txSummary} />, undefined, false)
  }

  const onMouseEnter = () => {
    setSelectedTxId(txSummary.id)
  }

  const onMouseLeave = () => {
    setSelectedTxId(undefined)
  }

  return (
    <CheckWallet allowNonOwner>
      {(isOk) => (
        <Tooltip title={isOk && !isNext ? 'You must execute the transaction with the lowest nonce first' : ''}>
          <span>
            <Button
              data-testid="execute-tx-btn"
              onClick={onClick}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              variant="contained"
              disabled={!isOk || isDisabled}
              size={compact ? 'small' : 'stretched'}
              sx={{ minWidth: '106.5px', py: compact ? 0.8 : undefined }}
            >
              Execute
            </Button>
          </span>
        </Tooltip>
      )}
    </CheckWallet>
  )
}

export default ExecuteTxButton
