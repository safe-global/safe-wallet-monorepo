import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import * as useRecoveryHook from '../useRecovery'
import { useDelayModifierByAddress } from '../useDelayModifierByAddress'
import type { RecoveryStateItem } from '../../services/recovery-state'

const buildDelayModifier = (overrides: Partial<RecoveryStateItem> = {}): RecoveryStateItem => ({
  address: faker.finance.ethereumAddress(),
  recoverers: [],
  expiry: 0n,
  delay: 0n,
  txNonce: 0n,
  queueNonce: 0n,
  queue: [],
  ...overrides,
})

describe('useDelayModifierByAddress', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should return the matching delay modifier', () => {
    const delayModifier1 = buildDelayModifier()
    const delayModifier2 = buildDelayModifier()

    jest.spyOn(useRecoveryHook, 'default').mockReturnValue([[delayModifier1, delayModifier2], undefined, false])

    const { result } = renderHook(() => useDelayModifierByAddress(delayModifier2.address))

    expect(result.current).toStrictEqual({ delayModifier: delayModifier2, loading: false })
  })

  it('should return undefined when recovery state is not available', () => {
    jest.spyOn(useRecoveryHook, 'default').mockReturnValue([undefined, undefined, false])

    const { result } = renderHook(() => useDelayModifierByAddress(faker.finance.ethereumAddress()))

    expect(result.current).toStrictEqual({ delayModifier: undefined, loading: false })
  })

  it('should pass through the loading flag from useRecovery', () => {
    jest.spyOn(useRecoveryHook, 'default').mockReturnValue([undefined, undefined, true])

    const { result } = renderHook(() => useDelayModifierByAddress(faker.finance.ethereumAddress()))

    expect(result.current).toStrictEqual({ delayModifier: undefined, loading: true })
  })
})
