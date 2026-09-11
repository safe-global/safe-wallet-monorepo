import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { SafeMessageStatus } from '@safe-global/store/gateway/types'
import type { ReactElement } from 'react'

import { Typography } from '@/components/ui/typography'
import { Spinner } from '@/components/ui/spinner'
import DateTime from '@/components/common/DateTime'
import MsgType from '@/components/safe-messages/MsgType'
import SignMsgButton from '@/components/safe-messages/SignMsgButton'
import useSafeMessageStatus from '@/hooks/messages/useSafeMessageStatus'
import TxConfirmations from '@/components/transactions/TxConfirmations'

import css from '@/components/transactions/TxSummary/styles.module.css'
import useIsSafeMessagePending from '@/hooks/messages/useIsSafeMessagePending'
import { isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'

const getStatusColor = (value: SafeMessageStatus): string => {
  switch (value) {
    case 'CONFIRMED':
      return 'var(--color-success-main)'
    case 'NEEDS_CONFIRMATION':
      return 'var(--color-warning-main)'
    default:
      return 'var(--color-text-primary)'
  }
}

const MsgSummary = ({ msg }: { msg: MessageItem }): ReactElement => {
  const { confirmationsSubmitted, confirmationsRequired } = msg
  const txStatusLabel = useSafeMessageStatus(msg)
  const isConfirmed = msg.status === 'CONFIRMED'
  const isPending = useIsSafeMessagePending(msg.messageHash)
  let type = ''
  if (isEIP712TypedData(msg.message)) {
    type = (msg.message as unknown as { primaryType: string }).primaryType
  }

  return (
    <div className={[css.gridContainer, css.message].join(' ')}>
      <div style={{ gridArea: 'type' }}>
        <MsgType msg={msg} />
      </div>

      <div style={{ gridArea: 'info' }}>{type || 'Signature'}</div>

      <div style={{ gridArea: 'date' }} className={css.date}>
        <DateTime value={msg.modifiedTimestamp} />
      </div>

      <div style={{ gridArea: 'confirmations' }}>
        {confirmationsRequired > 0 && (
          <TxConfirmations
            submittedConfirmations={confirmationsSubmitted}
            requiredConfirmations={confirmationsRequired}
          />
        )}
      </div>

      <div style={{ gridArea: 'status' }}>
        {isConfirmed || isPending ? (
          <Typography
            variant="paragraph-mini-bold"
            className="flex items-center gap-2"
            style={{ color: getStatusColor(msg.status) }}
          >
            {isPending && <Spinner className="size-3.5" />}

            {txStatusLabel}
          </Typography>
        ) : (
          <SignMsgButton msg={msg} compact />
        )}
      </div>
    </div>
  )
}

export default MsgSummary
