import { TransactionConfirmationStrategy } from '../TransactionConfirmationStrategy'
import { trackEvent } from '@/src/services/analytics'
import { createTxConfirmEvent } from '@/src/services/analytics/events/transactions'
import { ANALYTICS_LABELS } from '@/src/services/analytics/constants'
import { EventType } from '@/src/services/analytics/types'
import type { RootState } from '@/src/store'
import type { ActionWithPayload } from '@/src/store/utils/strategy/Strategy'
import { MiddlewareAPI, Dispatch } from '@reduxjs/toolkit'

jest.mock('@/src/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/src/services/analytics/events/transactions', () => ({
  createTxConfirmEvent: jest.fn(),
}))

jest.mock('@/src/services/analytics/types', () => ({
  ...jest.requireActual('@/src/services/analytics/types'),
}))

const mockTrackEvent = jest.mocked(trackEvent)
const mockCreateTxConfirmEvent = jest.mocked(createTxConfirmEvent)

describe('TransactionConfirmationStrategy', () => {
  let strategy: TransactionConfirmationStrategy
  let mockStore: MiddlewareAPI<Dispatch, RootState>

  beforeEach(() => {
    strategy = new TransactionConfirmationStrategy()
    mockStore = {
      dispatch: jest.fn(),
      getState: jest.fn(),
    } as unknown as MiddlewareAPI<Dispatch, RootState>

    jest.clearAllMocks()
  })

  describe('transaction confirmation', () => {
    it('should track transaction confirmation event with correct transaction type', () => {
      const mockTransaction = {
        txInfo: {
          type: 'Transfer',
          sender: { value: '0xSender' },
          recipient: { value: '0xRecipient' },
          direction: 'OUTGOING',
          transferInfo: {
            type: 'ERC20',
            tokenAddress: '0xToken',
            value: '1000000000000000000',
            imitation: false,
          },
        },
        id: 'tx123',
        timestamp: Date.now(),
        txStatus: 'SUCCESS',
      }

      const action: ActionWithPayload = {
        type: 'someAction/fulfilled',
        payload: mockTransaction,
      }

      const mockEventData = {
        eventName: EventType.TX_CONFIRMED,
        eventCategory: 'transactions',
        eventAction: 'Confirm transaction',
        eventLabel: ANALYTICS_LABELS.TRANSFER_TYPES.ERC20,
      }

      // Mock the function calls
      mockCreateTxConfirmEvent.mockReturnValue(mockEventData)

      strategy.execute(mockStore, action)

      expect(mockCreateTxConfirmEvent).toHaveBeenCalledWith(ANALYTICS_LABELS.TRANSFER_TYPES.ERC20)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
    })

    it('should handle custom transaction types', () => {
      const mockTransaction = {
        txInfo: {
          type: 'Custom',
          to: { value: '0xContract' },
          dataSize: '68',
          value: '0',
          isCancellation: false,
        },
        id: 'tx456',
        timestamp: Date.now(),
        txStatus: 'SUCCESS',
      }

      const action: ActionWithPayload = {
        type: 'transactions/confirm/fulfilled',
        payload: mockTransaction,
      }

      const mockEventData = {
        eventName: EventType.TX_CONFIRMED,
        eventCategory: 'transactions',
        eventAction: 'Confirm transaction',
        eventLabel: ANALYTICS_LABELS.BASE_TYPES.Custom,
      }

      mockCreateTxConfirmEvent.mockReturnValue(mockEventData)

      strategy.execute(mockStore, action)

      expect(mockCreateTxConfirmEvent).toHaveBeenCalledWith(ANALYTICS_LABELS.BASE_TYPES.Custom)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
    })

    it('should not track event when payload does not have txInfo', () => {
      const action: ActionWithPayload = {
        type: 'someAction/fulfilled',
        payload: {
          id: 'tx789',
          timestamp: Date.now(),
          // missing txInfo
        },
      }

      strategy.execute(mockStore, action)

      expect(mockCreateTxConfirmEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track event when payload is null', () => {
      const action: ActionWithPayload = {
        type: 'someAction/fulfilled',
        payload: null,
      }

      strategy.execute(mockStore, action)

      expect(mockCreateTxConfirmEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should not track event when payload is not an object', () => {
      const action: ActionWithPayload = {
        type: 'someAction/fulfilled',
        payload: 'string payload',
      }

      strategy.execute(mockStore, action)

      expect(mockCreateTxConfirmEvent).not.toHaveBeenCalled()
      expect(mockTrackEvent).not.toHaveBeenCalled()
    })

    it('should handle NFT transfer transactions', () => {
      const mockTransaction = {
        txInfo: {
          type: 'Transfer',
          sender: { value: '0xSender' },
          recipient: { value: '0xRecipient' },
          direction: 'OUTGOING',
          transferInfo: {
            type: 'ERC721',
            tokenAddress: '0xNFTContract',
            tokenId: '123',
          },
        },
        id: 'nft_tx',
        timestamp: Date.now(),
        txStatus: 'SUCCESS',
      }

      const action: ActionWithPayload = {
        type: 'nft/transfer/fulfilled',
        payload: mockTransaction,
      }

      const mockEventData = {
        eventName: EventType.TX_CONFIRMED,
        eventCategory: 'transactions',
        eventAction: 'Confirm transaction',
        eventLabel: ANALYTICS_LABELS.TRANSFER_TYPES.ERC721,
      }

      mockCreateTxConfirmEvent.mockReturnValue(mockEventData)

      strategy.execute(mockStore, action)

      expect(mockCreateTxConfirmEvent).toHaveBeenCalledWith(ANALYTICS_LABELS.TRANSFER_TYPES.ERC721)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
    })

    it('should handle settings change transactions', () => {
      const mockTransaction = {
        txInfo: {
          type: 'SettingsChange',
          dataDecoded: {
            method: 'addOwnerWithThreshold',
            parameters: [],
          },
          settingsInfo: {
            type: 'ADD_OWNER',
            owner: { value: '0xNewOwner' },
            threshold: 2,
          },
        },
        id: 'settings_tx',
        timestamp: Date.now(),
        txStatus: 'SUCCESS',
      }

      const action: ActionWithPayload = {
        type: 'settings/change/fulfilled',
        payload: mockTransaction,
      }

      const mockEventData = {
        eventName: EventType.TX_CONFIRMED,
        eventCategory: 'transactions',
        eventAction: 'Confirm transaction',
        eventLabel: ANALYTICS_LABELS.SETTINGS_TYPES.ADD_OWNER,
      }

      mockCreateTxConfirmEvent.mockReturnValue(mockEventData)

      strategy.execute(mockStore, action)

      expect(mockCreateTxConfirmEvent).toHaveBeenCalledWith(ANALYTICS_LABELS.SETTINGS_TYPES.ADD_OWNER)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
    })

    it('should handle rejection transactions', () => {
      const mockTransaction = {
        txInfo: {
          type: 'Custom',
          to: { value: '0xContract' },
          dataSize: '0',
          value: '0',
          isCancellation: true,
        },
        id: 'rejection_tx',
        timestamp: Date.now(),
        txStatus: 'SUCCESS',
      }

      const action: ActionWithPayload = {
        type: 'rejection/fulfilled',
        payload: mockTransaction,
      }

      const mockEventData = {
        eventName: EventType.TX_CONFIRMED,
        eventCategory: 'transactions',
        eventAction: 'Confirm transaction',
        eventLabel: ANALYTICS_LABELS.ENHANCED.rejection,
      }

      mockCreateTxConfirmEvent.mockReturnValue(mockEventData)

      strategy.execute(mockStore, action)

      expect(mockCreateTxConfirmEvent).toHaveBeenCalledWith(ANALYTICS_LABELS.ENHANCED.rejection)
      expect(mockTrackEvent).toHaveBeenCalledWith(mockEventData)
    })
  })
})
