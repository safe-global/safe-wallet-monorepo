import type { SafeMessageListItem } from '@safe-global/store/gateway/types'
import { toBeHex } from 'ethers'

import { safeMsgDispatch, SafeMsgEvent } from '@/services/safe-messages/safeMsgEvents'
import { showNotification } from '@/store/notificationsSlice'
import { renderHook } from '@/tests/test-utils'
import useSafeMessageNotifications, { _getSafeMessagesAwaitingConfirmations } from '../useSafeMessageNotifications'
import type { PendingSafeMessagesState } from '@/store/pendingSafeMessagesSlice'

jest.mock('@/store/notificationsSlice', () => {
  const original = jest.requireActual('@/store/notificationsSlice')
  return {
    ...original,
    showNotification: jest.fn(original.showNotification),
  }
})

describe('useSafeMessageNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSafeMessagesAwaitingConfirmations', () => {
    it('should return all SafeMessages awaiting confirmation of the current wallet', () => {
      const items: SafeMessageListItem[] = [
        {
          type: 'MESSAGE',
          status: 'NEEDS_CONFIRMATION',
          messageHash: '0x123',
          confirmations: [],
        } as unknown as SafeMessageListItem,
      ]

      const messages = _getSafeMessagesAwaitingConfirmations(items, {}, toBeHex('0x456', 20))

      expect(messages).toStrictEqual([
        {
          type: 'MESSAGE',
          status: 'NEEDS_CONFIRMATION',
          messageHash: '0x123',
          confirmations: [],
        },
      ])
    })

    it('should filter DATE_LABELs', () => {
      const items = [
        {
          type: 'DATE_LABEL' as const,
        } as SafeMessageListItem,
      ]

      const messages = _getSafeMessagesAwaitingConfirmations(items, {}, toBeHex('0x456', 20))

      expect(messages).toStrictEqual([])
    })

    it('should filter pending messages', () => {
      const items: SafeMessageListItem[] = [
        {
          type: 'MESSAGE',
          status: 'NEEDS_CONFIRMATION',
          messageHash: '0x123',
          confirmations: [
            {
              owner: {
                value: toBeHex('0x123', 20),
              },
              signature: '0xabc',
            },
          ],
        } as SafeMessageListItem,
      ]

      const pendingMsgs = {
        '0x123': true,
      } as PendingSafeMessagesState

      const messages = _getSafeMessagesAwaitingConfirmations(items, pendingMsgs, toBeHex('0x456', 20))

      expect(messages).toStrictEqual([])
    })

    it('should filter messages already confirmed by the connected wallet', () => {
      const items: SafeMessageListItem[] = [
        {
          type: 'MESSAGE',
          status: 'NEEDS_CONFIRMATION',
          messageHash: '0x123',
          confirmations: [
            {
              owner: {
                value: toBeHex('0x123', 20),
              },
              signature: '0xabc',
            },
          ],
        } as SafeMessageListItem,
      ]

      const messages = _getSafeMessagesAwaitingConfirmations(items, {}, toBeHex('0x123', 20))

      expect(messages).toStrictEqual([])
    })
  })

  // Message lifecycle notifications
  it('should show a notification when a message is created', () => {
    renderHook(() => useSafeMessageNotifications())

    safeMsgDispatch(SafeMsgEvent.PROPOSE, { messageHash: '0x123' })

    expect(showNotification).toHaveBeenCalledWith({
      message: 'You successfully signed the message.',
      groupKey: '0x123',
      variant: 'success',
    })
  })

  it('should show a notification when a message is confirmed', () => {
    renderHook(() => useSafeMessageNotifications())

    safeMsgDispatch(SafeMsgEvent.CONFIRM_PROPOSE, { messageHash: '0x456' })

    expect(showNotification).toHaveBeenCalledWith({
      message: 'You successfully confirmed the message.',
      groupKey: '0x456',
      variant: 'info',
    })
  })

  it.each([SafeMsgEvent.PROPOSE_FAILED, SafeMsgEvent.CONFIRM_PROPOSE_FAILED])(
    'should not show a notification for %s, which is rendered inline instead',
    (event) => {
      renderHook(() => useSafeMessageNotifications())

      safeMsgDispatch(event, { messageHash: '0x789', error: new Error('Other error') })

      expect(showNotification).not.toHaveBeenCalled()
    },
  )

  it('should show a notification when a message fully is confirmed', () => {
    renderHook(() => useSafeMessageNotifications())

    safeMsgDispatch(SafeMsgEvent.SIGNATURE_PREPARED, { messageHash: '0x012', requestId: 'test-id', signature: '0x456' })

    expect(showNotification).toHaveBeenCalledWith({
      message: 'The message was successfully confirmed.',
      groupKey: '0x012',
      variant: 'success',
    })
  })
})
