import { TransactionListItemType } from '@safe-global/store/gateway/types'
import { useQueuedTxsLength } from '../useTxQueue'
import * as store from '@/store'
import * as recoveryHooks from '../../features/recovery/hooks/useRecoveryQueue'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

describe('useQueuedTxsLength', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return an empty string if there are no queued transactions', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({
      data: {
        results: [],
        next: undefined,
      },
    })
    jest.spyOn(recoveryHooks, 'useRecoveryQueue').mockReturnValue([])

    const result = useQueuedTxsLength()
    expect(result).toEqual('')
  })

  it('should return the length of the queue as a string', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({
      data: {
        results: [
          { type: TransactionListItemType.TRANSACTION },
          { type: TransactionListItemType.TRANSACTION },
          { type: TransactionListItemType.TRANSACTION },
        ],
        next: undefined,
      },
    })
    jest.spyOn(recoveryHooks, 'useRecoveryQueue').mockReturnValue([])

    const result = useQueuedTxsLength()
    expect(result).toEqual('3')
  })

  it('should return the length of the queue as a string with a "+" if there are more pages', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({
      data: {
        results: [
          { type: TransactionListItemType.TRANSACTION },
          { type: TransactionListItemType.TRANSACTION },
          { type: TransactionListItemType.TRANSACTION },
        ],
        next: 'next',
      },
    })
    jest.spyOn(recoveryHooks, 'useRecoveryQueue').mockReturnValue([])

    const result = useQueuedTxsLength()
    expect(result).toEqual('3+')
  })

  it('should return the length of the queue and recovery queue as a string', () => {
    jest.spyOn(store, 'useAppSelector').mockReturnValue({
      data: {
        results: [
          { type: TransactionListItemType.TRANSACTION },
          { type: TransactionListItemType.TRANSACTION },
          { type: TransactionListItemType.TRANSACTION },
        ],
        next: undefined,
      },
    })
    jest.spyOn(recoveryHooks, 'useRecoveryQueue').mockReturnValue([{}, {}] as RecoveryQueueItem[])

    const result = useQueuedTxsLength()
    expect(result).toEqual('5')
  })
})
