import { createListenerMiddleware } from '@reduxjs/toolkit'
import {
  LabelValue,
  TransactionListItemType,
  DetailedExecutionInfoType,
} from '@safe-global/safe-gateway-typescript-sdk'
import type {
  TransactionListItem,
  Label,
  ConflictHeader,
  DateLabel,
  TransactionListPage,
} from '@safe-global/safe-gateway-typescript-sdk'

import * as txEvents from '@/services/tx/txEvents'
import { txQueueListener, txQueueSlice } from '../txQueueSlice'
import type { PendingTxsState } from '../pendingTxsSlice'
import { PendingStatus } from '../pendingTxsSlice'
import type { RootState } from '..'
import { faker } from '@faker-js/faker'

describe('txQueueSlice', () => {
  const listenerMiddlewareInstance = createListenerMiddleware<RootState>()

  const txDispatchSpy = jest.spyOn(txEvents, 'txDispatch')

  beforeEach(() => {
    listenerMiddlewareInstance.clearListeners()
    txQueueListener(listenerMiddlewareInstance)

    jest.clearAllMocks()
  })

  it('should dispatch SIGNATURE_INDEXED event for added signatures', () => {
    const state = {
      pendingTxs: {
        '0x123': {
          nonce: 1,
          chainId: '5',
          safeAddress: '0x0000000000000000000000000000000000000000',
          status: PendingStatus.SIGNING,
          signerAddress: '0x456',
        },
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
          type: DetailedExecutionInfoType.MULTISIG,
          missingSigners: [],
        },
      },
    } as unknown as TransactionListItem

    const action = txQueueSlice.actions.set({
      loading: false,
      data: {
        results: [transaction],
      },
    })

    listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

    expect(txDispatchSpy).toHaveBeenCalledWith(txEvents.TxEvent.SIGNATURE_INDEXED, { txId: '0x123' })
  })

  it('should dispatch SIGNATURE_INDEXED event for Nested Signing state', () => {
    const state = {
      pendingTxs: {
        '0x123': {
          nonce: 1,
          chainId: '5',
          safeAddress: '0x0000000000000000000000000000000000000000',
          status: PendingStatus.NESTED_SIGNING,
          signerAddress: '0x456',
          txHashOrParentSafeTxHash: faker.string.hexadecimal({ length: 64 }),
        },
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
          type: DetailedExecutionInfoType.MULTISIG,
          missingSigners: [],
        },
      },
    } as unknown as TransactionListItem

    const action = txQueueSlice.actions.set({
      loading: false,
      data: {
        results: [transaction],
      },
    })

    listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

    expect(txDispatchSpy).toHaveBeenCalledWith(txEvents.TxEvent.SIGNATURE_INDEXED, { txId: '0x123' })
  })

  it('should not dispatch an event if the queue slice is cleared', () => {
    const state = {
      pendingTxs: {
        '0x123': {
          nonce: 1,
          chainId: '5',
          safeAddress: '0x0000000000000000000000000000000000000000',
          status: PendingStatus.SIGNING,
          signerAddress: '0x456',
        },
      } as PendingTxsState,
    } as RootState

    const listenerApi = {
      getState: jest.fn(() => state),
      dispatch: jest.fn(),
    }

    const action = txQueueSlice.actions.set({
      loading: false,
      data: undefined, // Cleared
    })

    listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

    expect(txDispatchSpy).not.toHaveBeenCalled()
  })

  it('should not dispatch an event for date labels, labels or conflict headers', () => {
    const state = {
      pendingTxs: {
        '0x123': {
          nonce: 1,
          chainId: '5',
          safeAddress: '0x0000000000000000000000000000000000000000',
          status: PendingStatus.SIGNING,
          signerAddress: '0x456',
        },
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

    const action = txQueueSlice.actions.set({
      loading: false,
      data: {
        results: [dateLabel, label, conflictHeader],
      },
    })

    listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

    expect(txDispatchSpy).not.toHaveBeenCalled()
  })

  it('should not dispatch an event if tx is not signing', () => {
    const state = {
      pendingTxs: {
        '0x123': {
          nonce: 1,
          chainId: '5',
          safeAddress: '0x0000000000000000000000000000000000000000',
          status: PendingStatus.SIGNING,
          signerAddress: '0x456',
        },
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
      },
    } as TransactionListItem

    const action = txQueueSlice.actions.set({
      loading: false,
      data: {
        results: [transaction],
      },
    })

    listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action)

    expect(txDispatchSpy).not.toHaveBeenCalled()
  })

  it('should not dispatch event if signature is still missing', () => {
    const listenerApi = {
      getState: jest.fn(() => ({}) as RootState),
      dispatch: jest.fn(),
    }

    const next = jest.fn()

    const transaction = {
      type: TransactionListItemType.TRANSACTION,
      transaction: {
        id: '0x123',
        executionInfo: {
          type: DetailedExecutionInfoType.MULTISIG,
          missingSigners: [
            {
              value: '0x456',
            },
          ],
        },
      },
    } as TransactionListItem

    const payload: TransactionListPage = {
      results: [transaction],
    }

    const action = txQueueSlice.actions.set({
      loading: false,
      data: payload,
    })

    listenerMiddlewareInstance.middleware(listenerApi)(next)(action)

    expect(txDispatchSpy).not.toHaveBeenCalled()
  })
})
