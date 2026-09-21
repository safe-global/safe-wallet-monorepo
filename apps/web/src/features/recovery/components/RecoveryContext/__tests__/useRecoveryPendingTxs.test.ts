import { faker } from '@faker-js/faker'

import { RecoveryEvent, recoveryDispatch, RecoveryTxType } from '../../../services/recoveryEvents'
import { act, renderHook } from '@/tests/test-utils'
import { useRecoveryPendingTxs } from '../useRecoveryPendingTxs'

describe('useRecoveryPendingTxs', () => {
  it('should set pending status to PROCESSING when PROCESSING event is emitted', () => {
    const delayModifierAddress = faker.finance.ethereumAddress()
    const txHash = faker.string.hexadecimal()
    const recoveryTxHash = faker.string.hexadecimal()
    const txType = faker.helpers.enumValue(RecoveryTxType)
    const { result } = renderHook(() => useRecoveryPendingTxs())

    expect(result.current).toStrictEqual({})

    act(() => {
      recoveryDispatch(RecoveryEvent.PROCESSING, {
        moduleAddress: delayModifierAddress,
        txHash,
        recoveryTxHash,
        txType,
      })
    })

    expect(result.current).toStrictEqual({
      [recoveryTxHash]: { status: RecoveryEvent.PROCESSING, txType },
    })
  })

  it('should remove the pending status when REVERTED event is emitted', () => {
    const delayModifierAddress = faker.finance.ethereumAddress()
    const txHash = faker.string.hexadecimal()
    const recoveryTxHash = faker.string.hexadecimal()
    const txType = faker.helpers.enumValue(RecoveryTxType)
    const { result } = renderHook(() => useRecoveryPendingTxs())

    expect(result.current).toStrictEqual({})

    act(() => {
      recoveryDispatch(RecoveryEvent.PROCESSING, {
        moduleAddress: delayModifierAddress,
        txHash,
        recoveryTxHash,
        txType,
      })
      recoveryDispatch(RecoveryEvent.REVERTED, {
        moduleAddress: delayModifierAddress,
        txHash,
        recoveryTxHash,
        txType,
        error: new Error(),
      })
    })

    expect(result.current).toStrictEqual({})
  })

  it('should set pending status to INDEXING when PROCESSED event is emitted', () => {
    const delayModifierAddress = faker.finance.ethereumAddress()
    const txHash = faker.string.hexadecimal()
    const recoveryTxHash = faker.string.hexadecimal()
    const txType = faker.helpers.enumValue(RecoveryTxType)
    const { result } = renderHook(() => useRecoveryPendingTxs())

    expect(result.current).toStrictEqual({})

    act(() => {
      recoveryDispatch(RecoveryEvent.PROCESSING, {
        moduleAddress: delayModifierAddress,
        txHash,
        recoveryTxHash,
        txType,
      })
      recoveryDispatch(RecoveryEvent.PROCESSED, {
        moduleAddress: delayModifierAddress,
        txHash,
        recoveryTxHash,
        txType,
      })
    })

    expect(result.current).toStrictEqual({
      [recoveryTxHash]: { status: RecoveryEvent.PROCESSED, txType },
    })
  })

  // No need to test RecoveryEvent.FAILED as pending status is not set before it is dispatched
})
