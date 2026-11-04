import { renderHook } from '@/tests/test-utils'
import chains from '@safe-global/utils/config/chains'
import { mockCurrentChain } from '@/tests/mocks/hooks'
import { useRecoveryPeriods } from './useRecoveryPeriods'

jest.mock('@/hooks/useChains')

const labels = (periods: Array<{ label: string }>) => periods.map(({ label }) => label)

const LONG_PERIODS = ['2 days', '7 days', '14 days', '28 days', '56 days']
const TEST_PERIODS = ['1 minute', '5 minutes', '1 hour']

describe('useRecoveryPeriods', () => {
  it('offers a custom review window and day-long periods on a production chain', () => {
    mockCurrentChain({ chainId: chains.eth })

    const { result } = renderHook(() => useRecoveryPeriods())

    expect(labels(result.current.delay)).toEqual(['Custom period', ...LONG_PERIODS])
    expect(labels(result.current.expiration)).toEqual(['Never', ...LONG_PERIODS])
  })

  it('adds minute and hour periods on Sepolia so a recovery can be tested quickly', () => {
    mockCurrentChain({ chainId: chains.sep })

    const { result } = renderHook(() => useRecoveryPeriods())

    expect(labels(result.current.delay)).toEqual(['Custom period', ...TEST_PERIODS, ...LONG_PERIODS])
    expect(labels(result.current.expiration)).toEqual(['Never', ...TEST_PERIODS, ...LONG_PERIODS])
  })
})
