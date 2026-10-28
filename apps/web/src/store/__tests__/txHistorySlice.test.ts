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
import type { PendingTx, PendingTxsState } from '../pendingTxsSlice'
import { PendingStatus } from '../pendingTxsSlice'
import { txHistoryListener, txHistorySlice } from '../txHistorySlice'
import { faker } from '@faker-js/faker'

const CHAIN_ID = '11155111'
const SAFE_ADDRESS = faker.finance.ethereumAddress()

/** A pending tx of the open Safe */
const pendingTxOfSafe = (pendingTx: Partial<PendingTx>): PendingTx =>
  pendingTxBuilder()
    .with({ chainId: CHAIN_ID, safeAddress: SAFE_ADDRESS, ...pendingTx })
    .build()

/** The store with `pendingTxs` while the Safe at SAFE_ADDRESS on CHAIN_ID is open */
const stateWith = (pendingTxs: PendingTxsState): RootState =>
  ({
    pendingTxs,
    safeInfo: {
      data: {
        address: { value: SAFE_ADDRESS },
        chainId: CHAIN_ID,
      },
    } as unknown as RootState['safeInfo'],
  }) as RootState

const historyTx = (id: string, nonce: number, txInfo: object = { type: 'TRANSFER' }): TransactionListItem =>
  ({
    type: TransactionListItemType.TRANSACTION,
    conflictType: ConflictType.NONE,
    transaction: {
      id,
      executionInfo: {
        type: 'MULTISIG',
        nonce,
      },
      txInfo,
    } as unknown as Transaction,
  }) as TransactionListItem

describe('txHistorySlice', () => {
  describe('txHistoryListener', () => {
    const listenerMiddlewareInstance = createListenerMiddleware<RootState>()

    const txDispatchSpy = jest.spyOn(txEvents, 'txDispatch')

    const setHistory = (state: RootState, results: TransactionListItem[] | undefined) => {
      const listenerApi = {
        getState: jest.fn(() => state),
        dispatch: jest.fn(),
      }
      const action = txHistorySlice.actions.set({
        loading: false,
        loaded: true,
        data: results ? { results } : undefined,
      })

      listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

      return listenerApi
    }

    beforeEach(() => {
      listenerMiddlewareInstance.clearListeners()
      txHistoryListener(listenerMiddlewareInstance)

      jest.clearAllMocks()
    })

    it('should dispatch SUCCESS event if tx is pending', () => {
      const pendingTx = pendingTxOfSafe({ nonce: 1, status: PendingStatus.INDEXING })

      setHistory(stateWith({ '0x123': pendingTx }), [historyTx('0x123', 1)])

      expect(txDispatchSpy).toHaveBeenCalledWith(txEvents.TxEvent.SUCCESS, {
        nonce: 1,
        txId: '0x123',
        chainId: CHAIN_ID,
        safeAddress: SAFE_ADDRESS,
        groupKey: pendingTx.groupKey,
        txHash: undefined,
      })
    })

    it('should dispatch SUCCESS for the pending tx of the Safe when a nested Safe has a pending tx with the same nonce', () => {
      const parentTx = pendingTxOfSafe({ nonce: 0, status: PendingStatus.PROCESSING, txHash: '0xabc' })
      const childTx = pendingTxBuilder()
        .with({ chainId: CHAIN_ID, safeAddress: faker.finance.ethereumAddress(), nonce: 0 })
        .build()

      const listenerApi = setHistory(stateWith({ '0xchild': childTx, '0xparent': parentTx }), [
        historyTx('0xparent', 0),
      ])

      expect(txDispatchSpy).toHaveBeenCalledWith(
        txEvents.TxEvent.SUCCESS,
        expect.objectContaining({ txId: '0xparent', txHash: '0xabc' }),
      )
      expect(listenerApi.dispatch).not.toHaveBeenCalled()
    })

    it('should not clear the pending tx of the same address on another chain', () => {
      const otherChainTx = pendingTxBuilder().with({ chainId: '1', safeAddress: SAFE_ADDRESS, nonce: 1 }).build()

      const listenerApi = setHistory(stateWith({ '0x123': otherChainTx }), [historyTx('0x456', 1)])

      expect(txDispatchSpy).not.toHaveBeenCalled()
      expect(listenerApi.dispatch).not.toHaveBeenCalled()
    })

    it('should not dispatch an event if the history slice is cleared', () => {
      setHistory(stateWith({ '0x123': pendingTxOfSafe({}) }), undefined)

      expect(txDispatchSpy).not.toHaveBeenCalled()
    })

    it('should not dispatch an event if the Safe is not loaded', () => {
      const state = { pendingTxs: { '0x123': pendingTxOfSafe({ nonce: 1 }) }, safeInfo: {} } as unknown as RootState

      setHistory(state, [historyTx('0x123', 1)])

      expect(txDispatchSpy).not.toHaveBeenCalled()
    })

    it('should not dispatch an event for date labels, labels or conflict headers', () => {
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

      // @ts-expect-error - dateLabel, label, conflictHeader are not sometihng that CGW returns for history txs
      setHistory(stateWith({ '0x123': pendingTxOfSafe({ nonce: 0 }) }), [dateLabel, label, conflictHeader])

      expect(txDispatchSpy).not.toHaveBeenCalled()
    })

    it('should not dispatch an event/invalidate owned Safes if tx is not pending', () => {
      const listenerApi = setHistory(stateWith({ '0x123': pendingTxOfSafe({ nonce: 2 }) }), [
        historyTx('0x456', 1, { type: 'Custom', methodName: 'createProxyWithNonce' }),
      ])

      expect(txDispatchSpy).not.toHaveBeenCalled()
      expect(listenerApi.dispatch).not.toHaveBeenCalled()
    })

    it('should clear a replaced pending transaction and invalidate owned Safes for Safe creations', () => {
      const listenerApi = setHistory(
        stateWith({ '0x123': pendingTxOfSafe({ nonce: 1, status: PendingStatus.INDEXING }) }),
        [historyTx('0x456', 1, { type: 'Custom', methodName: 'createProxyWithNonce' })],
      )

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
        payload: { txId: '0x123' },
        type: 'pendingTxs/clearPendingTx',
      })
    })
  })
})
