import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import DeleteIcon from '@/public/images/common/delete.svg'
import CancelIcon from '@/public/images/common/cancel.svg'
import ReplaceTxIcon from '@/public/images/transactions/replace-tx.svg'
import { RefreshCw as CachedIcon } from 'lucide-react'

import css from './styles.module.css'
import TxCard from '@/components/tx-flow/common/TxCard'
import ExternalLink from '@/components/common/ExternalLink'
import ChoiceButton from '@/components/common/ChoiceButton'
import Track from '@/components/common/Track'
import { REJECT_TX_EVENTS } from '@/services/analytics/events/reject-tx'

export const REPLACE_TX_COPY = {
  title: (txNonce: number) => `Reject transaction #${txNonce}`,
}

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

export type DeleteTxButtonViewProps = {
  isDeletable: boolean
  onDelete: () => void
  modal: ReactNode
}

export const DeleteTxButtonView = ({ isDeletable, onDelete, modal }: DeleteTxButtonViewProps): ReactElement => {
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
            onClick={onDelete}
            title="Delete from the queue"
            description="Remove this transaction from the off-chain queue"
            disabled={!isDeletable}
          />
        </Track>
      </MaybeTooltip>

      {modal}
    </>
  )
}

export type ReplaceTxViewProps = {
  txNonce: number
  canCancel: boolean
  canDelete: boolean
  onReplace: () => void
  onReject: () => void
  deleteButton: ReactNode
}

export const ReplaceTxView = ({
  txNonce,
  canCancel,
  canDelete,
  onReplace,
  onReject,
  deleteButton,
}: ReplaceTxViewProps): ReactElement => {
  return (
    <TxCard>
      <div className="mt-4 flex justify-center">
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
            onClick={onReplace}
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
              onClick={onReject}
              disabled={!canCancel}
              title="Reject transaction"
              description="Propose an on-chain cancellation transaction with the same nonce"
              chip={canDelete ? 'Recommended' : undefined}
            />
          </Track>
        </MaybeTooltip>

        {canDelete && deleteButton}
      </div>
    </TxCard>
  )
}
