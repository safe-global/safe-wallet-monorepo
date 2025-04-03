import type { MessagePage } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { listenerMiddlewareInstance } from '.'

import { safeMsgDispatch, SafeMsgEvent } from '@/services/safe-messages/safeMsgEvents'
import { isSafeMessageListItem } from '@/utils/safe-message-guards'
import { makeLoadableSlice } from '@/store/common'
import { selectPendingSafeMessages } from '@/store/pendingSafeMessagesSlice'

const { slice, selector } = makeLoadableSlice('safeMessages', undefined as MessagePage | undefined)

export const safeMessagesSlice = slice
export const selectSafeMessages = selector

export const safeMessagesListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    actionCreator: safeMessagesSlice.actions.set,
    effect: (action, listenerApi) => {
      if (!action.payload.data) {
        return
      }

      const pendingMsgs = selectPendingSafeMessages(listenerApi.getState())

      for (const result of action.payload.data.results) {
        if (!isSafeMessageListItem(result)) {
          continue
        }

        const { messageHash } = result
        if (pendingMsgs[messageHash]) {
          safeMsgDispatch(SafeMsgEvent.UPDATED, { messageHash })
        }
      }
    },
  })
}
