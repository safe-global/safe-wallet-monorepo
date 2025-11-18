import { TransactionListItemType } from '@safe-global/store/gateway/types'
import * as recoveryHooks from '../../features/recovery/hooks/useRecoveryQueue'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import { renderHook } from '@/tests/test-utils'

// Mock useTxQueue module
const mockUseTxQueue = jest.fn()
jest.mock('../useTxQueue', () => ({
  __esModule: true,
  default: jest.fn((...args) => mockUseTxQueue(...args)),
  useQueuedTxsLength: jest.fn(() => {
    const page = mockUseTxQueue().page
    const { length } = page?.results?.filter((item: any) => item.type === 'TRANSACTION') ?? []
    const recoveryQueueSize = require('../../features/recovery/hooks/useRecoveryQueue').useRecoveryQueue().length
    const totalSize = length + recoveryQueueSize
    if (totalSize === 0) return ''
    const hasNextPage = page?.next != null
    return `${totalSize}${hasNextPage ? '+' : ''}`
  }),
}))

const useTxQueueModule = require('../useTxQueue')

describe('useQueuedTxsLength', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return an empty string if there are no queued transactions', () => {
    mockUseTxQueue.mockReturnValue({
      page: {
        results: [],
        next: null,
        previous: null,
      },
      error: undefined,
      loading: false,
    })
    jest.spyOn(recoveryHooks, 'useRecoveryQueue').mockReturnValue([])

    const { result } = renderHook(() => useTxQueueModule.useQueuedTxsLength())
    expect(result.current).toEqual('')
  })

  it('should return the length of the queue as a string', () => {
    mockUseTxQueue.mockReturnValue({
      page: {
        results: [
          { type: TransactionListItemType.TRANSACTION, transaction: {}, conflictType: 'None' },
          { type: TransactionListItemType.TRANSACTION, transaction: {}, conflictType: 'None' },
          { type: TransactionListItemType.TRANSACTION, transaction: {}, conflictType: 'None' },
        ],
        next: null,
        previous: null,
      },
      error: undefined,
      loading: false,
    })
    jest.spyOn(recoveryHooks, 'useRecoveryQueue').mockReturnValue([])

    const { result } = renderHook(() => useTxQueueModule.useQueuedTxsLength())
    expect(result.current).toEqual('3')
  })

  it('should return the length of the queue as a string with a "+" if there are more pages', () => {
    mockUseTxQueue.mockReturnValue({
      page: {
        results: [
          { type: TransactionListItemType.TRANSACTION, transaction: {}, conflictType: 'None' },
          { type: TransactionListItemType.TRANSACTION, transaction: {}, conflictType: 'None' },
          { type: TransactionListItemType.TRANSACTION, transaction: {}, conflictType: 'None' },
        ],
        next: 'https://next-page',
        previous: null,
      },
      error: undefined,
      loading: false,
    })
    jest.spyOn(recoveryHooks, 'useRecoveryQueue').mockReturnValue([])

    const { result } = renderHook(() => useTxQueueModule.useQueuedTxsLength())
    expect(result.current).toEqual('3+')
  })

  it('should return the length of the queue and recovery queue as a string', () => {
    mockUseTxQueue.mockReturnValue({
      page: {
        results: [
          { type: TransactionListItemType.TRANSACTION, transaction: {}, conflictType: 'None' },
          { type: TransactionListItemType.TRANSACTION, transaction: {}, conflictType: 'None' },
          { type: TransactionListItemType.TRANSACTION, transaction: {}, conflictType: 'None' },
        ],
        next: null,
        previous: null,
      },
      error: undefined,
      loading: false,
    })
    jest.spyOn(recoveryHooks, 'useRecoveryQueue').mockReturnValue([{}, {}] as RecoveryQueueItem[])

    const { result } = renderHook(() => useTxQueueModule.useQueuedTxsLength())
    expect(result.current).toEqual('5')
  })
})
