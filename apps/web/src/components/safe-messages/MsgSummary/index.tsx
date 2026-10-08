import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { ReactElement } from 'react'
import DateTime from '@/components/common/DateTime'
import MsgType from '@/components/safe-messages/MsgType'
import SignMsgButton from '@/components/safe-messages/SignMsgButton'
import useSafeMessageStatus from '@/hooks/messages/useSafeMessageStatus'
import useIsSafeMessagePending from '@/hooks/messages/useIsSafeMessagePending'
import { isEIP712TypedData } from '@safe-global/utils/utils/safe-messages'
import { MsgSummaryView } from '@views/components/safe-messages/MsgSummary/MsgSummaryView'

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
    <MsgSummaryView
      type={type}
      status={msg.status}
      statusLabel={txStatusLabel}
      confirmationsSubmitted={confirmationsSubmitted}
      confirmationsRequired={confirmationsRequired}
      isConfirmed={isConfirmed}
      isPending={isPending}
      msgType={<MsgType msg={msg} />}
      dateTime={<DateTime value={msg.modifiedTimestamp} />}
      signButton={<SignMsgButton msg={msg} compact />}
    />
  )
}

export default MsgSummary
