import type { SafeMessageListItem } from '@safe-global/store/gateway/types'
import { toBeHex } from 'ethers'

import { safeMsgDispatch, SafeMsgEvent } from '@/services/safe-messages/safeMsgEvents'
import { showNotification } from '@/store/notificationsSlice'
import { renderHook } from '@/tests/test-utils'
import useSafeMessageNotifications, { _getSafeMessagesAwaitingConfirmations } from '../useSafeMessageNotifications'
import type { PendingSafeMessagesState } from '@/store/pendingSafeMessagesSlice'
import { mapLedgerError } from '@/services/onboard/ledger-errors'
import { asError } from '@safe-global/utils/services/exceptions/utils'

jest.mock('@/store/notificationsSlice', () => {
  const original = jest.requireActual('@/store/notificationsSlice')
  return {
    ...original,
    showNotification: jest.fn(original.showNotification),
  }
})

describe('useSafeMessageNotifications', () => {
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

  it('should show a notification when a message creation fails', () => {
    renderHook(() => useSafeMessageNotifications())

    safeMsgDispatch(SafeMsgEvent.PROPOSE_FAILED, {
      messageHash: '0x456',
      error: new Error('Example error'),
    })

    expect(showNotification).toHaveBeenCalledWith({
      message: 'Signing the message failed. Please try again.',
      detailedMessage: 'Example error',
      groupKey: '0x456',
      variant: 'error',
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

  it('should show a notification when a message confirmation fails', () => {
    renderHook(() => useSafeMessageNotifications())

    safeMsgDispatch(SafeMsgEvent.CONFIRM_PROPOSE_FAILED, {
      messageHash: '0x789',
      error: new Error('Other error'),
    })

    expect(showNotification).toHaveBeenCalledWith({
      message: 'Confirming the message failed. Please try again.',
      detailedMessage: 'Other error',
      groupKey: '0x789',
      variant: 'error',
    })
  })

  it('should translate a Ledger device failure and withhold its raw details', () => {
    renderHook(() => useSafeMessageNotifications())

    const cause = mapLedgerError({ _tag: 'InvalidStatusWordError', originalError: new Error('no signature returned') })
    const error = Object.assign(
      new Error(`An unknown RPC error occurred.\n\nDetails: ${cause.message}\n\nVersion: viem@2.52.2`),
      { cause },
    )

    safeMsgDispatch(SafeMsgEvent.CONFIRM_PROPOSE_FAILED, { messageHash: '0x789', error })

    expect(showNotification).toHaveBeenCalledWith({
      message: 'Your Ledger could not complete the request.',
      detailedMessage: undefined,
      groupKey: '0x789',
      variant: 'error',
    })
  })

  it('should show a notification when a message fully is confirmed', () => {
    renderHook(() => useSafeMessageNotifications())

    safeMsgDispatch(SafeMsgEvent.SIGNATURE_PREPARED, { messageHash: '0x012', requestId: 'test-id', signature: '0x456' })

    expect(showNotification).toHaveBeenCalledWith({
      message: 'The message was successfully confirmed.',
      groupKey: '0x012',
      variant: 'success',
    })
  })

  describe('CGW response states (WA-3252)', () => {
    const HTML_502 =
      '<html><head><title>502 Bad Gateway</title></head><body><center><h1>502 Bad Gateway</h1></center><hr><center>nginx</center></body></html>'

    it('shows the agreed copy and no raw HTML for a 502 from CGW', () => {
      renderHook(() => useSafeMessageNotifications())

      safeMsgDispatch(SafeMsgEvent.PROPOSE_FAILED, {
        messageHash: '0x345',
        error: asError({
          status: 'PARSING_ERROR',
          originalStatus: 502,
          data: HTML_502,
          error: "SyntaxError: Unexpected token '<'",
        }),
      })

      expect(showNotification).toHaveBeenCalledWith({
        message: 'Something went wrong on our end. Try again.',
        detailedMessage: 'Error code CGW-502',
        groupKey: '0x345',
        variant: 'error',
      })
    })

    it('shows the banned-Safe copy for a 451', () => {
      renderHook(() => useSafeMessageNotifications())

      safeMsgDispatch(SafeMsgEvent.PROPOSE_FAILED, {
        messageHash: '0x346',
        error: asError({ status: 451, data: {} }),
      })

      expect(showNotification).toHaveBeenCalledWith({
        message: 'This Safe Account is not available.',
        detailedMessage: 'Error code CGW-451',
        groupKey: '0x346',
        variant: 'error',
      })
    })
  })
})
