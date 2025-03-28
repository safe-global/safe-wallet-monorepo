import type { MessageItem } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { SafeMessageStatus } from '@safe-global/store/gateway/types'

import useIsSafeMessagePending from './useIsSafeMessagePending'
import useWallet from '../wallets/useWallet'

const ConfirmingStatus = 'CONFIRMING'
const AwaitingConfirmationsStatus = 'AWAITING_CONFIRMATIONS'
const ConfirmedStatus = 'CONFIRMED'
const NeedsConfirmationStatus = 'NEEDS_CONFIRMATION'
type SafeMessageLocalStatus =
  | SafeMessageStatus
  | typeof ConfirmingStatus
  | typeof AwaitingConfirmationsStatus
  | typeof ConfirmedStatus
  | typeof NeedsConfirmationStatus

const STATUS_LABELS: { [_key in SafeMessageLocalStatus]: string } = {
  [ConfirmingStatus]: 'Confirming',
  [AwaitingConfirmationsStatus]: 'Awaiting confirmations',
  [ConfirmedStatus]: 'Confirmed',
  [NeedsConfirmationStatus]: 'Needs confirmation',
}

const useSafeMessageStatus = (msg: MessageItem) => {
  const isPending = useIsSafeMessagePending(msg.messageHash)
  const wallet = useWallet()

  if (isPending) {
    return STATUS_LABELS[ConfirmingStatus]
  }

  const hasWalletSigned = wallet && msg.confirmations.some(({ owner }) => owner.value === wallet.address)
  const isConfirmed = msg.status === ConfirmedStatus
  if (hasWalletSigned && !isConfirmed) {
    return STATUS_LABELS[AwaitingConfirmationsStatus]
  }

  return STATUS_LABELS[msg.status]
}

export default useSafeMessageStatus
