import { renderHook, waitFor } from '@/tests/test-utils'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { useGnosisPayDelayModule } from './useGnosisPayDelayModule'
import { GNOSIS_PAY_DELAY_MODIFIER_ADDRESS } from '../utils/isGnosisPayDelayModifier'
import { FEATURES } from '@safe-global/utils/utils/chains'
const sentinel = '0x0000000000000000000000000000000000000002'
let mockEnabled = true
let mockSafe = safeInfoBuilder()
  .with({ owners: [{ value: sentinel }], modules: [{ value: GNOSIS_PAY_DELAY_MODIFIER_ADDRESS }] })
  .build()
const mockProvider = {}
const mockHasFeature = jest.fn<boolean, [FEATURES]>(() => mockEnabled)
jest.mock('@/hooks/useChains', () => ({ useHasFeature: (flag: FEATURES) => mockHasFeature(flag) }))
jest.mock('@/hooks/useSafeInfo', () => () => ({ safe: mockSafe }))
jest.mock('@/hooks/wallets/web3', () => ({ useWeb3ReadOnly: () => mockProvider }))
beforeEach(() => {
  mockEnabled = true
  mockSafe = safeInfoBuilder()
    .with({ owners: [{ value: sentinel }], modules: [{ value: GNOSIS_PAY_DELAY_MODIFIER_ADDRESS }] })
    .build()
})
it('detects an activated Safe only with the chain feature enabled', async () => {
  const { result } = renderHook(() => useGnosisPayDelayModule())
  await waitFor(() => expect(result.current[0]?.value).toBe(GNOSIS_PAY_DELAY_MODIFIER_ADDRESS))
  expect(mockHasFeature).toHaveBeenCalledWith(FEATURES.GNOSIS_PAY)
})
it('does not replace ordinary Safe-owner actions for a Safe with the same Delay module', async () => {
  mockSafe.owners = [{ value: '0x0000000000000000000000000000000000000020' }]
  const { result } = renderHook(() => useGnosisPayDelayModule())
  await waitFor(() => expect(result.current).toEqual([undefined, undefined, false]))
})
it('fails closed when the chain flag is off', async () => {
  mockEnabled = false
  const { result } = renderHook(() => useGnosisPayDelayModule())
  await waitFor(() => expect(result.current).toEqual([undefined, undefined, false]))
})
it('does not detect when a caller opts out', async () => {
  const { result } = renderHook(() => useGnosisPayDelayModule({ enabled: false }))
  await waitFor(() => expect(result.current).toEqual([undefined, undefined, false]))
})
