import * as txEvents from '@/services/tx/txEvents'
import { pendingTxBuilder } from '@/tests/builders/pendingTx'
import { createListenerMiddleware } from '@reduxjs/toolkit'
import type {
  ConflictHeader,
  DateLabel,
  Label,
  TransactionListItem,
  TransactionSummary,
} from '@safe-global/safe-gateway-typescript-sdk'
import { LabelValue, TransactionListItemType } from '@safe-global/safe-gateway-typescript-sdk'
import type { RootState } from '..'
import type { PendingTxsState } from '../pendingTxsSlice'
import { PendingStatus } from '../pendingTxsSlice'
import { txHistoryListener, txHistorySlice } from '../txHistorySlice'
import { faker } from '@faker-js/faker'

describe('txHistorySlice', () => {
  describe('txHistoryListener', () => {
    const listenerMiddlewareInstance = createListenerMiddleware<RootState>()

    const txDispatchSpy = jest.spyOn(txEvents, 'txDispatch')

    beforeEach(() => {
      listenerMiddlewareInstance.clearListeners()
      txHistoryListener(listenerMiddlewareInstance)

      jest.clearAllMocks()
    })

    it('should dispatch SUCCESS event if tx is pending', () => {
      const state = {
        pendingTxs: {
          '0x123': pendingTxBuilder().with({ nonce: 1, status: PendingStatus.INDEXING }).build(),
        } as PendingTxsState,
      } as RootState

      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }

      const transaction = {
        type: TransactionListItemType.TRANSACTION,
        transaction: {
          id: '0x123',
          executionInfo: {
            type: 'MULTISIG',
            nonce: 1,
          },
          txInfo: {
            type: 'TRANSFER',
          },
        } as unknown as TransactionSummary,
      } as TransactionListItem

      const action = txHistorySlice.actions.set({
        loading: false,
        data: {
          results: [transaction],
        },
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(txDispatchSpy).toHaveBeenCalledWith(txEvents.TxEvent.SUCCESS, {
        nonce: 1,
        txId: '0x123',
        groupKey: expect.anything(),
      })
    })

    it('should not dispatch an event if the history slice is cleared', () => {
      const state = {
        pendingTxs: {
          '0x123': pendingTxBuilder().build(),
        } as PendingTxsState,
      } as RootState

      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }

      const action = txHistorySlice.actions.set({
        loading: false,
        data: undefined, // Cleared
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(txDispatchSpy).not.toHaveBeenCalled()
    })

    it('should not dispatch an event for date labels, labels or conflict headers', () => {
      const state = {
        pendingTxs: {
          '0x123': pendingTxBuilder().build(),
        } as PendingTxsState,
      } as RootState

      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }

      const dateLabel: DateLabel = {
        type: TransactionListItemType.DATE_LABEL,
        timestamp: 0,
      }

      const label: Label = {
        label: LabelValue.Queued,
        type: TransactionListItemType.LABEL,
      }

      const conflictHeader: ConflictHeader = {
        nonce: 0,
        type: TransactionListItemType.CONFLICT_HEADER,
      }

      const action = txHistorySlice.actions.set({
        loading: false,
        data: {
          results: [dateLabel, label, conflictHeader],
        },
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(txDispatchSpy).not.toHaveBeenCalled()
    })

    it('should not dispatch an event/invalidate owned Safes if tx is not pending', () => {
      const state = {
        pendingTxs: {
          '0x123': pendingTxBuilder().build(),
        } as PendingTxsState,
      } as RootState

      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }

      const transaction = {
        type: TransactionListItemType.TRANSACTION,
        transaction: {
          id: '0x456',
          executionInfo: {
            nonce: 1,
            type: 'MULTISIG',
          },
          txInfo: {
            type: 'Custom',
            methodName: 'createProxyWithNonce',
          },
        } as unknown as TransactionSummary,
      } as TransactionListItem

      const action = txHistorySlice.actions.set({
        loading: false,
        data: {
          results: [transaction],
        },
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(txDispatchSpy).not.toHaveBeenCalled()
      expect(listenerApi.dispatch).not.toHaveBeenCalled()
    })

    it('should clear a replaced pending transaction and invalidate owned Safes for Safe creations', () => {
      const state = {
        pendingTxs: {
          '0x123': pendingTxBuilder().with({ nonce: 1, status: PendingStatus.INDEXING }).build(),
        } as PendingTxsState,
        safeInfo: {
          data: {
            address: { value: faker.finance.ethereumAddress() },
            chainId: 1,
          },
        } as unknown as RootState['safeInfo'],
      } as RootState

      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }

      const transaction = {
        type: TransactionListItemType.TRANSACTION,
        transaction: {
          id: '0x456',
          executionInfo: {
            nonce: 1,
            type: 'MULTISIG',
          },
          txInfo: {
            type: 'Custom',
            methodName: 'createProxyWithNonce',
          },
        } as unknown as TransactionSummary,
      } as TransactionListItem

      const action = txHistorySlice.actions.set({
        loading: false,
        data: {
          results: [transaction],
        },
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(listenerApi.dispatch).toHaveBeenCalledTimes(2)
      expect(listenerApi.dispatch).toHaveBeenNthCalledWith(1, {
        payload: [
          {
            id: `${state.safeInfo.data!.chainId}:${state.safeInfo.data!.address.value}`,
            type: 'OwnedSafes',
          },
        ],
        type: 'gatewayApi/invalidateTags',
      })
      expect(listenerApi.dispatch).toHaveBeenNthCalledWith(2, {
        payload: expect.anything(),
        type: 'pendingTxs/clearPendingTx',
      })
    })
  })
})
