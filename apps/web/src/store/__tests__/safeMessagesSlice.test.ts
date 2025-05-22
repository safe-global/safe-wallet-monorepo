import type { MessageItem, DateLabel } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { createListenerMiddleware } from '@reduxjs/toolkit'

import * as safeMsgEvents from '@/services/safe-messages/safeMsgEvents'
import { safeMessagesListener, safeMessagesSlice } from '../safeMessagesSlice'
import type { RootState } from '..'
import type { PendingSafeMessagesState } from '../pendingSafeMessagesSlice'

describe('safeMessagesSlice', () => {
  describe('safeMessagesListener', () => {
    const listenerMiddlewareInstance = createListenerMiddleware<RootState>()

    const safeMsgDispatchSpy = jest.spyOn(safeMsgEvents, 'safeMsgDispatch')

    beforeEach(() => {
      listenerMiddlewareInstance.clearListeners()
      safeMessagesListener(listenerMiddlewareInstance)

      jest.clearAllMocks()
    })

    it('should dispatch UPDATED event if message is pending', () => {
      const state = {
        pendingSafeMessages: {
          '0x123': true,
        } as PendingSafeMessagesState,
      } as RootState

      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }

      const message = {
        type: 'MESSAGE',
        messageHash: '0x123',
      } as MessageItem

      const action = safeMessagesSlice.actions.set({
        loading: false,
        data: {
          results: [message],
        },
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(safeMsgDispatchSpy).toHaveBeenCalledWith(safeMsgEvents.SafeMsgEvent.UPDATED, {
        messageHash: '0x123',
      })
    })

    it('should not dispatch an event if the message slice is cleared', () => {
      const state = {
        pendingSafeMessages: {
          '0x123': true,
        } as PendingSafeMessagesState,
      } as RootState

      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }

      const action = safeMessagesSlice.actions.set({
        loading: false,
        data: undefined, // Cleared
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(safeMsgDispatchSpy).not.toHaveBeenCalled()
    })

    it('should not dispatch an event for date labels', () => {
      const state = {
        pendingSafeMessages: {
          '0x123': true,
        } as PendingSafeMessagesState,
      } as RootState

      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }

      const dateLabel: DateLabel = {
        type: 'DATE_LABEL' as const,
        timestamp: 0,
      }

      const action = safeMessagesSlice.actions.set({
        loading: false,
        data: {
          results: [dateLabel],
        },
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(safeMsgDispatchSpy).not.toHaveBeenCalled()
    })

    it('should not dispatch an event if message is not pending', () => {
      const state = {
        pendingSafeMessages: {
          '0x123': true,
        } as PendingSafeMessagesState,
      } as RootState

      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }

      const message = {
        type: 'MESSAGE',
        messageHash: '0x456',
      } as MessageItem

      const action = safeMessagesSlice.actions.set({
        loading: false,
        data: {
          results: [message],
        },
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(safeMsgDispatchSpy).not.toHaveBeenCalled()
    })
  })
})
