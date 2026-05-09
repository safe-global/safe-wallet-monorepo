import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { pendingTxsSlice, PendingStatus, addPendingTx, setPendingTxStatus, clearPendingTx } from '../../pendingTxsSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import pendingTxsListeners from '../pendingTxs'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { AppStartListening } from '@/src/store'
import { generateAddress, generateTxId, generateTxHash, generateTaskId } from '@safe-global/test'

jest.mock('@safe-global/utils/services/SimpleTxWatcher', () => ({
  SimpleTxWatcher: {
    getInstance: jest.fn(() => ({
      watchTxHash: jest.fn(() => Promise.resolve()),
    })),
  },
}))

jest.mock('@safe-global/utils/services/RelayTxWatcher', () => ({
  RelayTxWatcher: {
    getInstance: jest.fn(() => ({
      watchTaskId: jest.fn(() =>
        Promise.resolve({
          status: 200,
          receipt: {
            transactionHash: '0xabc123',
          },
        }),
      ),
      stopWatchingTaskId: jest.fn(),
    })),
  },
  TIMEOUT_ERROR_CODE: 'TIMEOUT',
}))

jest.mock('@safe-global/store/gateway/cgwClient', () => ({
  ...jest.requireActual('@safe-global/store/gateway/cgwClient'),
  getBaseUrl: jest.fn(() => 'https://test-cgw.example.com'),
}))

jest.mock('@safe-global/utils/services/SimplePoller', () => ({
  SimplePoller: {
    getInstance: jest.fn(() => ({
      watch: jest.fn(() => Promise.resolve()),
    })),
  },
}))

jest.mock('@/src/store/chains', () => ({
  selectChainById: jest.fn(() => ({
    chainId: '1',
    chainName: 'Ethereum',
    rpcUri: { value: 'https://rpc.example.com' },
  })),
}))

jest.mock('@/src/services/web3', () => ({
  createWeb3ReadOnly: jest.fn(() => ({})),
}))

jest.mock('@safe-global/utils/utils/helpers', () => ({
  delay: jest.fn(() => Promise.resolve()),
}))

describe('pendingTxsListeners', () => {
  const createTestStore = () => {
    const listenerMiddleware = createListenerMiddleware()
    pendingTxsListeners(listenerMiddleware.startListening as AppStartListening)

    return configureStore({
      reducer: {
        pendingTxs: pendingTxsSlice.reducer,
        chains: () => ({
          data: {
            '1': {
              chainId: '1',
              chainName: 'Ethereum',
              rpcUri: { value: 'https://rpc.example.com' },
            },
          },
        }),
        [cgwApi.reducerPath]: cgwApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({ serializableCheck: false })
          .prepend(listenerMiddleware.middleware)
          .concat(cgwApi.middleware),
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('addPendingTx listener', () => {
    it('should add PK transaction to pending state with PROCESSING status', () => {
      const store = createTestStore()
      const txId = generateTxId()
      const txHash = generateTxHash()
      const walletAddress = generateAddress()
      const safeAddress = generateAddress()

      store.dispatch(
        addPendingTx({
          txId,
          type: ExecutionMethod.WITH_PK,
          chainId: '1',
          safeAddress,
          txHash,
          walletAddress,
          walletNonce: 5,
        }),
      )

      const state = store.getState()
      expect(state.pendingTxs[txId]).toBeDefined()
      expect(state.pendingTxs[txId].status).toBe(PendingStatus.PROCESSING)
      expect(state.pendingTxs[txId].type).toBe(ExecutionMethod.WITH_PK)
    })

    it('should add relay transaction to pending state with PROCESSING status', () => {
      const store = createTestStore()
      const txId = generateTxId()
      const taskId = generateTaskId()
      const safeAddress = generateAddress()

      store.dispatch(
        addPendingTx({
          txId,
          type: ExecutionMethod.WITH_RELAY,
          chainId: '1',
          safeAddress,
          taskId,
        }),
      )

      const state = store.getState()
      expect(state.pendingTxs[txId]).toBeDefined()
      expect(state.pendingTxs[txId].status).toBe(PendingStatus.PROCESSING)
      expect(state.pendingTxs[txId].type).toBe(ExecutionMethod.WITH_RELAY)
    })
  })

  describe('setPendingTxStatus listener', () => {
    it('should update pending tx status to INDEXING', () => {
      const store = createTestStore()
      const txId = generateTxId()
      const txHash = generateTxHash()
      const walletAddress = generateAddress()
      const safeAddress = generateAddress()

      store.dispatch(
        addPendingTx({
          txId,
          type: ExecutionMethod.WITH_PK,
          chainId: '1',
          safeAddress,
          txHash,
          walletAddress,
          walletNonce: 5,
        }),
      )

      store.dispatch(setPendingTxStatus({ txId, chainId: '1', status: PendingStatus.INDEXING }))

      const state = store.getState()
      expect(state.pendingTxs[txId].status).toBe(PendingStatus.INDEXING)
    })

    it('should update pending tx status to FAILED with error', () => {
      const store = createTestStore()
      const txId = generateTxId()
      const txHash = generateTxHash()
      const walletAddress = generateAddress()
      const safeAddress = generateAddress()

      store.dispatch(
        addPendingTx({
          txId,
          type: ExecutionMethod.WITH_PK,
          chainId: '1',
          safeAddress,
          txHash,
          walletAddress,
          walletNonce: 5,
        }),
      )

      store.dispatch(
        setPendingTxStatus({
          txId,
          chainId: '1',
          status: PendingStatus.FAILED,
          error: 'Transaction reverted',
        }),
      )

      const state = store.getState()
      expect(state.pendingTxs[txId].status).toBe(PendingStatus.FAILED)
      expect((state.pendingTxs[txId] as { error: string }).error).toBe('Transaction reverted')
    })

    it('should update pending tx status to SUCCESS', async () => {
      jest.useFakeTimers()
      const store = createTestStore()
      const txId = generateTxId()
      const txHash = generateTxHash()
      const walletAddress = generateAddress()
      const safeAddress = generateAddress()

      store.dispatch(
        addPendingTx({
          txId,
          type: ExecutionMethod.WITH_PK,
          chainId: '1',
          safeAddress,
          txHash,
          walletAddress,
          walletNonce: 5,
        }),
      )

      store.dispatch(setPendingTxStatus({ txId, chainId: '1', status: PendingStatus.SUCCESS }))

      const stateAfterSuccess = store.getState()
      expect(stateAfterSuccess.pendingTxs[txId].status).toBe(PendingStatus.SUCCESS)

      jest.useRealTimers()
    })

    it('should not update status if tx does not exist', () => {
      const store = createTestStore()
      const txId = generateTxId()

      store.dispatch(setPendingTxStatus({ txId, chainId: '1', status: PendingStatus.INDEXING }))

      const state = store.getState()
      expect(state.pendingTxs[txId]).toBeUndefined()
    })
  })

  describe('clearPendingTx action', () => {
    it('should remove pending tx from state', () => {
      const store = createTestStore()
      const txId = generateTxId()
      const txHash = generateTxHash()
      const walletAddress = generateAddress()
      const safeAddress = generateAddress()

      store.dispatch(
        addPendingTx({
          txId,
          type: ExecutionMethod.WITH_PK,
          chainId: '1',
          safeAddress,
          txHash,
          walletAddress,
          walletNonce: 5,
        }),
      )

      expect(store.getState().pendingTxs[txId]).toBeDefined()

      store.dispatch(clearPendingTx({ txId }))

      expect(store.getState().pendingTxs[txId]).toBeUndefined()
    })
  })

  describe('setRelayTxHash action', () => {
    it('should update txHash for relay transaction', () => {
      const store = createTestStore()
      const txId = generateTxId()
      const taskId = generateTaskId()
      const safeAddress = generateAddress()
      const newTxHash = generateTxHash()

      store.dispatch(
        addPendingTx({
          txId,
          type: ExecutionMethod.WITH_RELAY,
          chainId: '1',
          safeAddress,
          taskId,
        }),
      )

      store.dispatch(pendingTxsSlice.actions.setRelayTxHash({ txId, txHash: newTxHash }))

      const state = store.getState()
      expect((state.pendingTxs[txId] as { txHash?: string }).txHash).toBe(newTxHash)
    })

    it('should not update txHash for PK transaction', () => {
      const store = createTestStore()
      const txId = generateTxId()
      const txHash = generateTxHash()
      const walletAddress = generateAddress()
      const safeAddress = generateAddress()
      const newTxHash = generateTxHash()

      store.dispatch(
        addPendingTx({
          txId,
          type: ExecutionMethod.WITH_PK,
          chainId: '1',
          safeAddress,
          txHash,
          walletAddress,
          walletNonce: 5,
        }),
      )

      store.dispatch(pendingTxsSlice.actions.setRelayTxHash({ txId, txHash: newTxHash }))

      const state = store.getState()
      expect((state.pendingTxs[txId] as { txHash: string }).txHash).toBe(txHash)
    })
  })

  describe('clearAllPendingTxs action', () => {
    it('should clear all pending transactions', () => {
      const store = createTestStore()

      store.dispatch(
        addPendingTx({
          txId: generateTxId(),
          type: ExecutionMethod.WITH_PK,
          chainId: '1',
          safeAddress: generateAddress(),
          txHash: generateTxHash(),
          walletAddress: generateAddress(),
          walletNonce: 1,
        }),
      )

      store.dispatch(
        addPendingTx({
          txId: generateTxId(),
          type: ExecutionMethod.WITH_RELAY,
          chainId: '1',
          safeAddress: generateAddress(),
          taskId: generateTaskId(),
        }),
      )

      expect(Object.keys(store.getState().pendingTxs).length).toBe(2)

      store.dispatch(pendingTxsSlice.actions.clearAllPendingTxs())

      expect(Object.keys(store.getState().pendingTxs).length).toBe(0)
    })
  })
})
