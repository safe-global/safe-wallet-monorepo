import type { listenerMiddlewareInstance } from '.'
import { cgwApi as messagesApi } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

import { safeMsgDispatch, SafeMsgEvent } from '@/services/safe-messages/safeMsgEvents'
import { isSafeMessageListItem } from '@/utils/safe-message-guards'
import { selectPendingSafeMessages } from '@/store/pendingSafeMessagesSlice'

/**
 * Listen for changes in safe messages from RTK Query and dispatch update events
 * This replaces the old Redux slice-based listener
 */
export const safeMessagesListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  // Check if endpoint exists before setting up listener (may not exist in test environment)
  if (!messagesApi.endpoints?.messagesGetMessagesBySafeV1?.matchFulfilled) {
    return
  }

  listenerMiddleware.startListening({
    matcher: messagesApi.endpoints.messagesGetMessagesBySafeV1.matchFulfilled,
    effect: (action, listenerApi) => {
      if (!action.payload) {
        return
      }

      const pendingMsgs = selectPendingSafeMessages(listenerApi.getState())

      for (const result of action.payload.results) {
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
