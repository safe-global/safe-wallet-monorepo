import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import * as useRecoveryHook from '../useRecovery'
import { useDelayModifierByAddress } from '../useDelayModifierByAddress'
import type { RecoveryStateItem } from '../../services/recovery-state'

describe('useDelayModifierByAddress', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return the matching delay modifier', () => {
    const delayModifier1 = {
      address: faker.finance.ethereumAddress(),
    } as unknown as RecoveryStateItem

    const delayModifier2 = {
      address: faker.finance.ethereumAddress(),
    } as unknown as RecoveryStateItem

    jest.spyOn(useRecoveryHook, 'default').mockReturnValue([[delayModifier1, delayModifier2], undefined, false])

    const { result } = renderHook(() => useDelayModifierByAddress(delayModifier2.address))

    expect(result.current).toStrictEqual(delayModifier2)
  })

  it('should return undefined when recovery state is not available', () => {
    jest.spyOn(useRecoveryHook, 'default').mockReturnValue([undefined, undefined, false])

    const { result } = renderHook(() => useDelayModifierByAddress(faker.finance.ethereumAddress()))

    expect(result.current).toBeUndefined()
  })
})
