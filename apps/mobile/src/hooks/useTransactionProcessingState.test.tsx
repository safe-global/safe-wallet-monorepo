import { renderHook } from '@/src/tests/test-utils'
import { useTransactionProcessingState } from './useTransactionProcessingState'
import { PendingStatus } from '@/src/store/pendingTxsSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'

describe('useTransactionProcessingState', () => {
  describe('isSigning', () => {
    it('returns true when transaction is being signed', () => {
      const { result } = renderHook(() => useTransactionProcessingState('tx123'), {
        signingState: {
          signings: {
            tx123: { status: 'signing', startedAt: Date.now() },
          },
        },
      })

      expect(result.current.isSigning).toBe(true)
      expect(result.current.isProcessing).toBe(true)
    })

    it('returns false when signing is complete', () => {
      const { result } = renderHook(() => useTransactionProcessingState('tx123'), {
        signingState: {
          signings: {
            tx123: { status: 'success', startedAt: Date.now(), completedAt: Date.now() },
          },
        },
      })

      expect(result.current.isSigning).toBe(false)
    })
  })

  describe('isExecuting', () => {
    it('returns true when transaction is being executed', () => {
      const { result } = renderHook(() => useTransactionProcessingState('tx123'), {
        executingState: {
          executions: {
            tx123: { status: 'executing', startedAt: Date.now(), executionMethod: ExecutionMethod.WITH_PK },
          },
        },
      })

      expect(result.current.isExecuting).toBe(true)
      expect(result.current.isProcessing).toBe(true)
    })

    it('returns false when execution is complete', () => {
      const { result } = renderHook(() => useTransactionProcessingState('tx123'), {
        executingState: {
          executions: {
            tx123: {
              status: 'success',
              startedAt: Date.now(),
              completedAt: Date.now(),
              executionMethod: ExecutionMethod.WITH_PK,
            },
          },
        },
      })

      expect(result.current.isExecuting).toBe(false)
    })
  })

  describe('isPendingOnChain', () => {
    it('returns true when transaction status is PROCESSING', () => {
      const { result } = renderHook(() => useTransactionProcessingState('tx123'), {
        pendingTxs: {
          tx123: {
            status: PendingStatus.PROCESSING,
            type: ExecutionMethod.WITH_PK,
            chainId: '1',
            safeAddress: '0x123',
            txHash: '0xabc',
            walletAddress: '0x456',
            walletNonce: 1,
          },
        },
      })

      expect(result.current.isPendingOnChain).toBe(true)
      expect(result.current.isProcessing).toBe(true)
    })

    it('returns true when transaction status is INDEXING', () => {
      const { result } = renderHook(() => useTransactionProcessingState('tx123'), {
        pendingTxs: {
          tx123: {
            status: PendingStatus.INDEXING,
            type: ExecutionMethod.WITH_PK,
            chainId: '1',
            safeAddress: '0x123',
            txHash: '0xabc',
            walletAddress: '0x456',
            walletNonce: 1,
          },
        },
      })

      expect(result.current.isPendingOnChain).toBe(true)
      expect(result.current.isProcessing).toBe(true)
    })

    it('returns false when transaction status is SUCCESS', () => {
      const { result } = renderHook(() => useTransactionProcessingState('tx123'), {
        pendingTxs: {
          tx123: {
            status: PendingStatus.SUCCESS,
            type: ExecutionMethod.WITH_PK,
            chainId: '1',
            safeAddress: '0x123',
            txHash: '0xabc',
            walletAddress: '0x456',
            walletNonce: 1,
          },
        },
      })

      expect(result.current.isPendingOnChain).toBe(false)
    })

    it('returns false when transaction status is FAILED', () => {
      const { result } = renderHook(() => useTransactionProcessingState('tx123'), {
        pendingTxs: {
          tx123: {
            status: PendingStatus.FAILED,
            type: ExecutionMethod.WITH_PK,
            chainId: '1',
            safeAddress: '0x123',
            txHash: '0xabc',
            walletAddress: '0x456',
            walletNonce: 1,
            error: 'Transaction failed',
          },
        },
      })

      expect(result.current.isPendingOnChain).toBe(false)
    })
  })

  describe('isProcessing', () => {
    it('returns false when no processing states are active', () => {
      const { result } = renderHook(() => useTransactionProcessingState('tx123'))

      expect(result.current.isProcessing).toBe(false)
      expect(result.current.isSigning).toBe(false)
      expect(result.current.isExecuting).toBe(false)
      expect(result.current.isPendingOnChain).toBe(false)
    })

    it('returns true when multiple states are active', () => {
      const { result } = renderHook(() => useTransactionProcessingState('tx123'), {
        signingState: {
          signings: {
            tx123: { status: 'signing', startedAt: Date.now() },
          },
        },
        executingState: {
          executions: {
            tx123: { status: 'executing', startedAt: Date.now(), executionMethod: ExecutionMethod.WITH_PK },
          },
        },
      })

      expect(result.current.isProcessing).toBe(true)
      expect(result.current.isSigning).toBe(true)
      expect(result.current.isExecuting).toBe(true)
    })

    it('returns correct state for different txIds', () => {
      const initialState = {
        signingState: {
          signings: {
            tx123: { status: 'signing' as const, startedAt: Date.now() },
          },
        },
      }

      const { result: result123 } = renderHook(() => useTransactionProcessingState('tx123'), initialState)
      const { result: result456 } = renderHook(() => useTransactionProcessingState('tx456'), initialState)

      expect(result123.current.isProcessing).toBe(true)
      expect(result456.current.isProcessing).toBe(false)
    })
  })
})
