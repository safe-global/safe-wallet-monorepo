import { useContext, useState } from 'react'
import { type NextRouter, useRouter } from 'next/router'
import { useQueuedTxByNonce } from '@/hooks/useTxQueue'
import { isCustomTxInfo } from '@/utils/transaction-guards'
import { TxModalContext } from '../..'
import TokenTransferFlow from '../TokenTransfer'
import RejectTx from '../RejectTx'
import TxLayout from '@/components/tx-flow/common/TxLayout'
import DeleteTxModal from './DeleteTxModal'
import useWallet from '@/hooks/wallets/useWallet'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'
import { useRecommendedNonce } from '@/components/tx/shared/hooks'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { withSpaceId } from '@/hooks/useUrlSpaceId'
import {
  DeleteTxButtonView,
  REPLACE_TX_COPY,
  ReplaceTxView,
} from '@views/components/tx-flow/flows/ReplaceTx/ReplaceTxView'

const goToQueue = (router: NextRouter) => {
  if (router.pathname === AppRoutes.transactions.tx) {
    router.push({
      pathname: AppRoutes.transactions.queue,
      query: withSpaceId({ safe: router.query.safe }, router.query.spaceId),
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
    <DeleteTxButtonView
      isDeletable={isDeletable}
      onDelete={() => setIsDeleting(true)}
      modal={
        safeTxHash &&
        isDeleting && <DeleteTxModal onSuccess={onDeleteSuccess} onClose={onDeleteClose} safeTxHash={safeTxHash} />
      }
    />
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
    <TxLayout title={REPLACE_TX_COPY.title(txNonce)} step={0} hideNonce isReplacement>
      <ReplaceTxView
        txNonce={txNonce}
        canCancel={canCancel}
        canDelete={!!canDelete}
        onReplace={() => setTxFlow(<TokenTransferFlow txNonce={txNonce} />)}
        onReject={() => setTxFlow(<RejectTx txNonce={txNonce} />)}
        deleteButton={
          canDelete && (
            <DeleteTxButton
              data-testid="delete-tx"
              safeTxHash={safeTxHash}
              txNonce={txNonce}
              onSuccess={() => setTxFlow(undefined)}
            />
          )
        }
      />
    </TxLayout>
  )
}

export default ReplaceTxMenu
