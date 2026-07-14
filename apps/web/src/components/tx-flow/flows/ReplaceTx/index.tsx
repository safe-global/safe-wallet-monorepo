import { type ReactNode, useContext, useState } from 'react'
import { type NextRouter, useRouter } from 'next/router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import DeleteIcon from '@/public/images/common/delete.svg'
import CancelIcon from '@/public/images/common/cancel.svg'
import ReplaceTxIcon from '@/public/images/transactions/replace-tx.svg'
import { RefreshCw as CachedIcon } from 'lucide-react'
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
import Track from '@/components/common/Track'
import { REJECT_TX_EVENTS } from '@/services/analytics/events/reject-tx'
import { useRecommendedNonce } from '@/components/tx/shared/hooks'
import { FEATURES } from '@safe-global/utils/utils/chains'

const MaybeTooltip = ({ title, children }: { title: string; children: ReactNode }) => {
  if (!title) {
    return <span className="w-full">{children}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger render={<span className="w-full" />}>{children}</TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  )
}

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
      <Typography variant="paragraph-mini" className={css.or}>
        or
      </Typography>

      <Typography variant="paragraph-small" className="mb-1 block">
        Don’t want to have this transaction anymore? Remove it permanently from the queue.
      </Typography>

      <MaybeTooltip
        title={isDeletable ? '' : 'You can only delete the last transaction in the queue, or a duplicate transaction.'}
      >
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
      </MaybeTooltip>

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
        <div className="mt-4 text-center">
          <ReplaceTxIcon />
        </div>

        <Typography variant="paragraph-small" className="-mt-2 mb-2 block">
          You can replace or reject this transaction on-chain. It requires gas fees and your signature.{' '}
          <Track {...REJECT_TX_EVENTS.READ_MORE}>
            <ExternalLink href="https://help.safe.global/articles/4016097317-Why-do-I-need-to-pay-for-cancelling-a-transaction?">
              Read more
            </ExternalLink>
          </Track>
        </Typography>

        <div className="flex flex-col gap-4">
          <Track {...REJECT_TX_EVENTS.REPLACE_TX_BUTTON} as="div">
            <ChoiceButton
              icon={CachedIcon}
              onClick={() => setTxFlow(<TokenTransferFlow txNonce={txNonce} />)}
              title="Replace with another transaction"
              description="Propose a new transaction with the same nonce to overwrite this one"
              chip="Recommended"
            />
          </Track>

          <MaybeTooltip title={canCancel ? '' : `Transaction with nonce ${txNonce} already has a reject transaction`}>
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
          </MaybeTooltip>

          {canDelete && (
            <DeleteTxButton
              data-testid="delete-tx"
              safeTxHash={safeTxHash}
              txNonce={txNonce}
              onSuccess={() => setTxFlow(undefined)}
            />
          )}
        </div>
      </TxCard>
    </TxLayout>
  )
}

export default ReplaceTxMenu
