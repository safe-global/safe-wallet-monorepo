import type { TransactionListItem } from '@safe-global/store/gateway/types'
import { LabelValue, TransactionListItemType, ConflictType } from '@safe-global/store/gateway/types'
import type {
  ConflictHeaderQueuedItem,
  DateLabel,
  LabelQueuedItem,
  Transaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import * as txEvents from '@/services/tx/txEvents'
import { pendingTxBuilder } from '@/tests/builders/pendingTx'
import { createListenerMiddleware } from '@reduxjs/toolkit'
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
      const pendingTx = pendingTxBuilder().with({ nonce: 1, status: PendingStatus.INDEXING }).build()
      const state = {
        pendingTxs: {
          '0x123': pendingTx,
        } as PendingTxsState,
      } as RootState

      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }

      const transaction = {
        type: TransactionListItemType.TRANSACTION,
        conflictType: ConflictType.NONE,
        transaction: {
          id: '0x123',
          executionInfo: {
            type: 'MULTISIG',
            nonce: 1,
          },
          txInfo: {
            type: 'TRANSFER',
          },
        } as unknown as Transaction,
      } as TransactionListItem

      const action = txHistorySlice.actions.set({
        loading: false,
        loaded: true,
        data: {
          results: [transaction],
        },
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(txDispatchSpy).toHaveBeenCalledWith(txEvents.TxEvent.SUCCESS, {
        nonce: 1,
        txId: '0x123',
        chainId: pendingTx.chainId,
        safeAddress: pendingTx.safeAddress,
        groupKey: pendingTx.groupKey,
        txHash: undefined,
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
        loaded: true,
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

      const label: LabelQueuedItem = {
        label: LabelValue.Queued,
        type: TransactionListItemType.LABEL,
      }

      const conflictHeader: ConflictHeaderQueuedItem = {
        nonce: 0,
        type: TransactionListItemType.CONFLICT_HEADER,
      }

      const action = txHistorySlice.actions.set({
        loading: false,
        loaded: true,
        data: {
          // @ts-expect-error - dateLabel, label, conflictHeader are not sometihng that CGW returns for history txs
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
        conflictType: ConflictType.NONE,
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
        } as unknown as Transaction,
      } as TransactionListItem

      const action = txHistorySlice.actions.set({
        loading: false,
        loaded: true,
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
        conflictType: ConflictType.NONE,
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
        } as unknown as Transaction,
      } as TransactionListItem

      const action = txHistorySlice.actions.set({
        loading: false,
        loaded: true,
        data: {
          results: [transaction],
        },
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      expect(listenerApi.dispatch).toHaveBeenCalledTimes(2)
      expect(listenerApi.dispatch).toHaveBeenNthCalledWith(1, {
        payload: [
          {
            type: 'owners',
          },
        ],
        type: 'api/invalidateTags',
      })
      expect(listenerApi.dispatch).toHaveBeenNthCalledWith(2, {
        payload: expect.anything(),
        type: 'pendingTxs/clearPendingTx',
      })
    })
  })
})
