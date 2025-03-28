import { useContext, useState } from 'react'
import { type NextRouter, useRouter } from 'next/router'
import { Box, Tooltip, Typography } from '@mui/material'
import DeleteIcon from '@/public/images/common/delete.svg'
import CancelIcon from '@/public/images/common/cancel.svg'
import ReplaceTxIcon from '@/public/images/transactions/replace-tx.svg'
import CachedIcon from '@mui/icons-material/Cached'
import { useQueuedTxByNonce } from '@/hooks/useTxQueue'
import { isCustomTxInfo } from '@/utils/transaction-guards'

import css from './styles.module.css'
import { TxModalContext } from '../..'
import TokenTransferFlow from '../TokenTransfer'
import RejectTx from '../RejectTx'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import TxCard from '@/components/tx-flow/common/TxCard'
import DeleteTxModal from './DeleteTxModal'
import ExternalLink from '@/components/common/ExternalLink'
import ChoiceButton from '@/components/common/ChoiceButton'
import useWallet from '@/hooks/wallets/useWallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import Track from '@/components/common/Track'
import { REJECT_TX_EVENTS } from '@/services/analytics/events/reject-tx'
import { useRecommendedNonce } from '@/components/tx/SignOrExecuteForm/hooks'

const goToQueue = (router: NextRouter) => {
  if (router.pathname === AppRoutes.transactions.tx) {
    router.push({
      pathname: AppRoutes.transactions.queue,
      query: { safe: router.query.safe },
    })
  }
}

/**
 * To avoid nonce gaps in the queue, we allow deleting the last transaction in the queue or duplicates.
 * The recommended nonce is used to calculate the last transaction in the queue.
 */
const useIsNonceDeletable = (txNonce: number) => {
  const queuedTxsByNonce = useQueuedTxByNonce(txNonce)
  const recommendedNonce = useRecommendedNonce() || 0
  const duplicateCount = queuedTxsByNonce?.length || 0
  return duplicateCount > 1 || txNonce === recommendedNonce - 1
}

const DeleteTxButton = ({
  safeTxHash,
  txNonce,
  onSuccess,
}: {
  safeTxHash: string
  txNonce: number
  onSuccess: () => void
}) => {
  const router = useRouter()
  const isDeletable = useIsNonceDeletable(txNonce)
  const [isDeleting, setIsDeleting] = useState(false)

  const onDeleteSuccess = () => {
    setIsDeleting(false)
    goToQueue(router)
    onSuccess()
  }
  const onDeleteClose = () => setIsDeleting(false)

  return (
    <>
      <Typography variant="overline" className={css.or}>
        or
      </Typography>

      <Typography variant="body2" mb={0.5}>
        Don’t want to have this transaction anymore? Remove it permanently from the queue.
      </Typography>

      <Tooltip
        arrow
        placement="top"
        title={isDeletable ? '' : 'You can only delete the last transaction in the queue, or a duplicate transaction.'}
      >
        <span style={{ width: '100%' }}>
          <Track {...REJECT_TX_EVENTS.DELETE_OFFCHAIN_BUTTON} as="div">
            <ChoiceButton
              icon={DeleteIcon}
              iconColor="error"
              onClick={() => setIsDeleting(true)}
              title="Delete from the queue"
              description="Remove this transaction from the off-chain queue"
              disabled={!isDeletable}
            />
          </Track>
        </span>
      </Tooltip>

      {safeTxHash && isDeleting && (
        <DeleteTxModal onSuccess={onDeleteSuccess} onClose={onDeleteClose} safeTxHash={safeTxHash} />
      )}
    </>
  )
}

const ReplaceTxMenu = ({
  txNonce,
  safeTxHash,
  proposer,
}: {
  txNonce: number
  safeTxHash?: string
  proposer?: string
}) => {
  const wallet = useWallet()
  const { setTxFlow } = useContext(TxModalContext)
  const queuedTxsByNonce = useQueuedTxByNonce(txNonce)
  const canCancel = !queuedTxsByNonce?.some(
    (item) => isCustomTxInfo(item.transaction.txInfo) && item.transaction.txInfo.isCancellation,
  )

  const isDeleteEnabled = useHasFeature(FEATURES.DELETE_TX)
  const canDelete = safeTxHash && isDeleteEnabled && proposer && wallet && sameAddress(wallet.address, proposer)

  return (
    <TxLayout title={`Reject transaction #${txNonce}`} step={0} hideNonce isReplacement>
      <TxCard>
        <Box mt={2} textAlign="center">
          <ReplaceTxIcon />
        </Box>

        <Typography variant="body2" mt={-1} mb={1}>
          You can replace or reject this transaction on-chain. It requires gas fees and your signature.{' '}
          <Track {...REJECT_TX_EVENTS.READ_MORE}>
            <ExternalLink href="https://help.safe.global/en/articles/40836-why-do-i-need-to-pay-for-cancelling-a-transaction">
              Read more
            </ExternalLink>
          </Track>
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          <Track {...REJECT_TX_EVENTS.REPLACE_TX_BUTTON} as="div">
            <ChoiceButton
              icon={CachedIcon}
              onClick={() => setTxFlow(<TokenTransferFlow txNonce={txNonce} />)}
              title="Replace with another transaction"
              description="Propose a new transaction with the same nonce to overwrite this one"
              chip="Recommended"
            />
          </Track>

          <Tooltip
            arrow
            placement="top"
            title={canCancel ? '' : `Transaction with nonce ${txNonce} already has a reject transaction`}
          >
            <span style={{ width: '100%' }}>
              <Track {...REJECT_TX_EVENTS.REJECT_ONCHAIN_BUTTON} as="div">
                <ChoiceButton
                  icon={CancelIcon}
                  iconColor="warning"
                  onClick={() => setTxFlow(<RejectTx txNonce={txNonce} />)}
                  disabled={!canCancel}
                  title="Reject transaction"
                  description="Propose an on-chain cancellation transaction with the same nonce"
                  chip={canDelete ? 'Recommended' : undefined}
                />
              </Track>
            </span>
          </Tooltip>

          {canDelete && (
            <DeleteTxButton
              data-testid="delete-tx"
              safeTxHash={safeTxHash}
              txNonce={txNonce}
              onSuccess={() => setTxFlow(undefined)}
            />
          )}
        </Box>
      </TxCard>
    </TxLayout>
  )
}

export default ReplaceTxMenu
