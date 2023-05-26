import type { TransactionSummary } from '@safe-global/safe-gateway-typescript-sdk'
import { Button, SvgIcon, Tooltip } from '@mui/material'

import type { ReactElement } from 'react'
import { useContext } from 'react'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import useIsPending from '@/hooks/useIsPending'
import IconButton from '@mui/material/IconButton'
import ErrorIcon from '@/public/images/notifications/error.svg'
import Track from '@/components/common/Track'
import { TX_LIST_EVENTS } from '@/services/analytics/events/txList'
import CheckWallet from '@/components/common/CheckWallet'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { getTxButtonTooltip } from '@/components/transactions/utils'
import { ModalContext, ModalType } from '@/components/TxFlow/ModalProvider'

const RejectTxButton = ({
  txSummary,
  compact = false,
}: {
  txSummary: TransactionSummary
  compact?: boolean
}): ReactElement | null => {
  const { setVisibleModal } = useContext(ModalContext)
  const txNonce = isMultisigExecutionInfo(txSummary.executionInfo) ? txSummary.executionInfo.nonce : undefined
  const isPending = useIsPending(txSummary.id)
  const safeSDK = useSafeSDK()
  const isDisabled = isPending || !safeSDK

  const tooltipTitle = getTxButtonTooltip('Replace', { hasSafeSDK: !!safeSDK })

  const openReplacementModal = () => {
    setVisibleModal({ type: ModalType.ReplaceTx, props: { txNonce } })
  }

  return (
    <CheckWallet>
      {(isOk) => (
        <Track {...TX_LIST_EVENTS.REJECT}>
          {compact ? (
            <Tooltip title={tooltipTitle} arrow placement="top">
              <span>
                <IconButton onClick={openReplacementModal} color="error" size="small" disabled={!isOk || isDisabled}>
                  <SvgIcon component={ErrorIcon} inheritViewBox fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <Button onClick={openReplacementModal} variant="danger" disabled={!isOk || isDisabled} size="stretched">
              Replace
            </Button>
          )}
        </Track>
      )}
    </CheckWallet>
  )
}

export default RejectTxButton
