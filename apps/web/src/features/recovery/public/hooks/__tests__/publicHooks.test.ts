import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { mockHasFeature, mockWallet } from '@/tests/mocks/hooks'
import recoveryStore from '../../../components/RecoveryContext'
import { seedRecoveryScenario } from '../../utils/test-helpers'
import type { RecoveryStateItem } from '../../types'
import { useIsRecoverer } from '../useIsRecoverer'
import { useIsRecoverySupported } from '../useIsRecoverySupported'
import useRecovery from '../useRecovery'
import { useRecoveryQueue } from '../useRecoveryQueue'

jest.mock('@/hooks/useChains')
jest.mock('@/hooks/wallets/useWallet')

const recoverer = faker.finance.ethereumAddress()
const queueItem = seedRecoveryScenario('waiting')
const delayModifier: RecoveryStateItem = {
  address: faker.finance.ethereumAddress(),
  recoverers: [recoverer],
  expiry: 0n,
  delay: 1n,
  txNonce: 0n,
  queueNonce: 1n,
  queue: [queueItem],
}

const setRecoveryFlag = (isEnabled: boolean | undefined) => {
  jest
    .requireMock('@/hooks/useChains')
    .useHasFeature.mockImplementation((feature: FEATURES) => (feature === FEATURES.RECOVERY ? isEnabled : false))
}

describe('recovery public hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    recoveryStore.setStore({ state: [[delayModifier], undefined, false], pending: {} })
    mockWallet({ address: recoverer })
  })

  afterEach(() => {
    recoveryStore.setStore(undefined)
  })

  describe('useIsRecoverySupported', () => {
    it.each([
      [true, true],
      [false, false],
      [undefined, false],
    ])('should, when the recovery flag is %s, return %s', (flag, expected) => {
      setRecoveryFlag(flag)

      const { result } = renderHook(() => useIsRecoverySupported())

      expect(result.current).toBe(expected)
    })
  })

  describe('useRecovery', () => {
    it('should, when the flag is on, return the loaded recovery state', () => {
      mockHasFeature({ [FEATURES.RECOVERY]: true })

      const { result } = renderHook(() => useRecovery())

      expect(result.current).toEqual([[delayModifier], undefined, false])
    })

    it.each([false, undefined])('should, when the flag is %s, return no recovery state', (flag) => {
      setRecoveryFlag(flag)

      const { result } = renderHook(() => useRecovery())

      expect(result.current).toEqual([undefined, undefined, false])
    })
  })

  describe('useRecoveryQueue', () => {
    it('should, when the flag is on, return the queued recovery transactions', () => {
      mockHasFeature({ [FEATURES.RECOVERY]: true })

      const { result } = renderHook(() => useRecoveryQueue())

      expect(result.current).toEqual([queueItem])
    })

    it('should, when the flag is off, return an empty queue', () => {
      mockHasFeature(false)

      const { result } = renderHook(() => useRecoveryQueue())

      expect(result.current).toEqual([])
    })
  })

  describe('useIsRecoverer', () => {
    it('should, when the flag is on and the wallet is a recoverer, return true', () => {
      mockHasFeature({ [FEATURES.RECOVERY]: true })

      const { result } = renderHook(() => useIsRecoverer())

      expect(result.current).toBe(true)
    })

    it('should, when the flag is off, return false for a recoverer', () => {
      mockHasFeature(false)

      const { result } = renderHook(() => useIsRecoverer())

      expect(result.current).toBe(false)
    })
  })
})
