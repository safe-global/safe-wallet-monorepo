import type { RequestId } from '@safe-global/safe-apps-sdk'

import { IS_DEV } from '@/config/constants'
import EventBus from '../EventBus'

export enum SafeMsgEvent {
  // Create message
  PROPOSE = 'PROPOSE',
  PROPOSE_FAILED = 'PROPOSE_FAILED',

  // Confirm message
  CONFIRM_PROPOSE = 'CONFIRM_PROPOSE',
  CONFIRM_PROPOSE_FAILED = 'CONFIRM_PROPOSE_FAILED',

  // Dispatched after the backend returns a new message signature
  // Used to clear the pending status of a message
  UPDATED = 'UPDATED',

  // Final signature prepared
  SIGNATURE_PREPARED = 'SIGNATURE_PREPARED',
}

type SafeMessageHash = { messageHash: string }

interface SignedMessageEvents {
  [SafeMsgEvent.PROPOSE]: SafeMessageHash
  [SafeMsgEvent.PROPOSE_FAILED]: SafeMessageHash & { error: Error }
  [SafeMsgEvent.CONFIRM_PROPOSE]: SafeMessageHash
  [SafeMsgEvent.CONFIRM_PROPOSE_FAILED]: SafeMessageHash & { error: Error }
  [SafeMsgEvent.UPDATED]: SafeMessageHash
  [SafeMsgEvent.SIGNATURE_PREPARED]: SafeMessageHash & { requestId?: RequestId; signature: string }
}

const safeMsgEventBus = new EventBus<SignedMessageEvents>()

export const safeMsgDispatch = safeMsgEventBus.dispatch.bind(safeMsgEventBus)

export const safeMsgSubscribe = safeMsgEventBus.subscribe.bind(safeMsgEventBus)

if (IS_DEV) {
  Object.values(SafeMsgEvent).forEach((event: SafeMsgEvent) => {
    safeMsgSubscribe<SafeMsgEvent>(event, (detail) => {
      console.info(`Message ${event} event received`, detail)
    })
  })
}
