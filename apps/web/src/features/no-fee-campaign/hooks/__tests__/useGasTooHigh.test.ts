import { renderHook } from '@/tests/test-utils'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useGasTooHigh } from '../useGasTooHigh'
import * as useGasLimitModule from '@/hooks/useGasLimit'
import * as useIsNoFeeCampaignEnabledModule from '../useIsNoFeeCampaignEnabled'

const mockSafeTx = { data: {} } as SafeTransaction

const mockGasLimit = (gasLimit: bigint | undefined) => {
  jest
    .spyOn(useGasLimitModule, 'default')
    .mockReturnValue({ gasLimit, gasLimitError: undefined, gasLimitLoading: false })
}

const mockCampaignEnabled = (enabled: boolean) => {
  jest.spyOn(useIsNoFeeCampaignEnabledModule, 'useIsNoFeeCampaignEnabled').mockReturnValue(enabled)
}

describe('useGasTooHigh', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns false for a >1M-gas tx when the No-Fee campaign is not enabled', () => {
    mockCampaignEnabled(false)
    mockGasLimit(BigInt(2_600_000))

    const { result } = renderHook(() => useGasTooHigh(mockSafeTx))

    expect(result.current).toBe(false)
  })

  it('returns true for a >1M-gas tx when the No-Fee campaign is enabled', () => {
    mockCampaignEnabled(true)
    mockGasLimit(BigInt(2_600_000))

    const { result } = renderHook(() => useGasTooHigh(mockSafeTx))

    expect(result.current).toBe(true)
  })

  it('returns false for a tx within the cap when the campaign is enabled', () => {
    mockCampaignEnabled(true)
    mockGasLimit(BigInt(500_000))

    const { result } = renderHook(() => useGasTooHigh(mockSafeTx))

    expect(result.current).toBe(false)
  })

  it('returns false when the gas limit is unknown', () => {
    mockCampaignEnabled(true)
    mockGasLimit(undefined)

    const { result } = renderHook(() => useGasTooHigh(mockSafeTx))

    expect(result.current).toBe(false)
  })
})
