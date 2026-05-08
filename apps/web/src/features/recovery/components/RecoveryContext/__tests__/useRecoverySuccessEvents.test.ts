import { faker } from '@faker-js/faker'

import { renderHook } from '@/tests/test-utils'
import { useRecoverySuccessEvents } from '../useRecoverySuccessEvents'
import { recoveryDispatch, RecoveryEvent, RecoveryTxType } from '../../../services/recoveryEvents'

jest.mock('../../../services/recoveryEvents', () => ({
  ...jest.requireActual('../../../services/recoveryEvents'),
  recoveryDispatch: jest.fn(),
}))

const mockRecoveryDispatch = recoveryDispatch as jest.MockedFunction<typeof recoveryDispatch>

describe('useRecoverySuccessEvents', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should not dispatch SUCCESS event if recoveryState is not defined', () => {
    const pending = {
      [faker.string.hexadecimal()]: {},
    }

    const { result } = renderHook(() => useRecoverySuccessEvents(pending as any))

    expect(result.current).toBeUndefined()

    expect(mockRecoveryDispatch).not.toHaveBeenCalled()
  })

  it('should not dispatch SUCCESS event if recoveryState is empty', () => {
    const pending = {
      [faker.string.hexadecimal()]: {},
    }
    const recoveryState = [] as any[]

    const { result } = renderHook(() => useRecoverySuccessEvents(pending as any, recoveryState))

    expect(result.current).toBeUndefined()

    expect(mockRecoveryDispatch).not.toHaveBeenCalled()
  })

  it('should not dispatch SUCCESS event if pending is empty', () => {
    const pending = {}
    const recoveryState = [{ queue: [] }]

    const { result } = renderHook(() => useRecoverySuccessEvents(pending, recoveryState as any))

    expect(result.current).toBeUndefined()

    expect(mockRecoveryDispatch).not.toHaveBeenCalled()
  })

  it('should not dispatch SUCCESS event if pending is not PROCESSED', () => {
    const pending = {
      [faker.string.hexadecimal()]: {
        status: faker.helpers.arrayElement([RecoveryEvent.PROCESSING, RecoveryEvent.FAILED]),
      },
    }
    const recoveryState = [{ queue: [] }]

    renderHook(() => useRecoverySuccessEvents(pending as any, recoveryState as any))

    expect(mockRecoveryDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch SUCCESS event if pending is PROCESSED and txType is PROPOSAL', () => {
    const pending = {
      [faker.string.hexadecimal()]: {
        status: RecoveryEvent.PROCESSED,
        txType: RecoveryTxType.PROPOSAL,
      },
    }
    const recoveryState = [{ queue: [] }]

    renderHook(() => useRecoverySuccessEvents(pending as any, recoveryState as any))

    expect(mockRecoveryDispatch).toHaveBeenCalledWith(RecoveryEvent.SUCCESS, {
      recoveryTxHash: expect.any(String),
      txType: RecoveryTxType.PROPOSAL,
    })
  })

  it('should not dispatch SUCCESS event if pending is PROCESSED and txType is not PROPOSAL and there is a queue', () => {
    const recoveryTxHash = faker.string.hexadecimal()
    const pending = {
      [recoveryTxHash]: {
        status: RecoveryEvent.PROCESSED,
        txType: faker.helpers.arrayElement([RecoveryTxType.EXECUTION, RecoveryTxType.SKIP_EXPIRED]),
      },
    }
    const recoveryState = [
      {
        queue: [
          {
            args: {
              txHash: recoveryTxHash,
            },
          },
        ],
      },
    ]

    renderHook(() => useRecoverySuccessEvents(pending as any, recoveryState as any))

    expect(mockRecoveryDispatch).not.toHaveBeenCalled()
  })

  it('should dispatch SUCCESS event if pending is PROCESSED and pending transaction is not queued', () => {
    const pending = {
      [faker.string.hexadecimal()]: {
        status: RecoveryEvent.PROCESSED,
        txType: RecoveryTxType.PROPOSAL,
      },
    }
    const recoveryState = [{ queue: [] }]

    renderHook(() => useRecoverySuccessEvents(pending as any, recoveryState as any))

    expect(mockRecoveryDispatch).toHaveBeenCalledWith(RecoveryEvent.SUCCESS, {
      recoveryTxHash: expect.any(String),
      txType: RecoveryTxType.PROPOSAL,
    })
  })
})
