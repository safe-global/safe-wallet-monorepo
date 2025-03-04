import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { getRecoveryDelayModifiers } from '@/features/recovery/services/delay-modifier'
import { addressExBuilder, safeInfoBuilder } from '@/tests/builders/safe'
import { act, renderHook } from '@/tests/test-utils'
import { useRecoveryDelayModifiers } from '../useRecoveryDelayModifiers'

jest.mock('@/features/recovery/services/delay-modifier')

const mockGetRecoveryDelayModifiers = getRecoveryDelayModifiers as jest.MockedFunction<typeof getRecoveryDelayModifiers>

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/wallets/web3')
jest.mock('@/hooks/useChains')

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseWeb3ReadOnly = useWeb3ReadOnly as jest.MockedFunction<typeof useWeb3ReadOnly>
const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>

describe('useRecoveryDelayModifiers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not fetch if the current chain does not support Delay Modifiers', async () => {
    jest.useFakeTimers()

    mockUseHasFeature.mockReturnValue(false)
    const provider = {}
    mockUseWeb3ReadOnly.mockReturnValue(provider as any)
    const safe = safeInfoBuilder().build()
    const safeInfo = { safe, safeAddress: safe.address.value }
    mockUseSafeInfo.mockReturnValue(safeInfo as any)

    const { result } = renderHook(() => useRecoveryDelayModifiers())

    // Give enough time for loading to occur, if it will
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    expect(result.current).toEqual([undefined, undefined, false])
    expect(mockGetRecoveryDelayModifiers).not.toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })

  it('should not fetch is there is no provider', async () => {
    jest.useFakeTimers()

    mockUseHasFeature.mockReturnValue(true)
    mockUseWeb3ReadOnly.mockReturnValue(undefined)
    const safe = safeInfoBuilder().build()
    const safeInfo = { safe, safeAddress: safe.address.value }
    mockUseSafeInfo.mockReturnValue(safeInfo as any)

    const { result } = renderHook(() => useRecoveryDelayModifiers())

    // Give enough time for loading to occur, if it will
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    expect(result.current).toEqual([undefined, undefined, false])
    expect(mockGetRecoveryDelayModifiers).not.toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })

  it('should not fetch if there is no Safe modules enabled', async () => {
    jest.useFakeTimers()

    mockUseHasFeature.mockReturnValue(true)
    const provider = {}
    mockUseWeb3ReadOnly.mockReturnValue(provider as any)
    const safe = safeInfoBuilder().with({ modules: [] }).build()
    const safeInfo = { safe, safeAddress: safe.address.value }
    mockUseSafeInfo.mockReturnValue(safeInfo as any)

    const { result } = renderHook(() => useRecoveryDelayModifiers())

    // Give enough time for loading to occur, if it will
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    expect(result.current).toEqual([undefined, undefined, false])
    expect(mockGetRecoveryDelayModifiers).not.toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })

  it('should not fetch if only the spending limit is enabled', async () => {
    jest.useFakeTimers()

    mockUseHasFeature.mockReturnValue(true)
    const provider = {}
    mockUseWeb3ReadOnly.mockReturnValue(provider as any)
    const chainId = '5'
    const safe = safeInfoBuilder()
      .with({ chainId, modules: [{ value: '0xCFbFaC74C26F8647cBDb8c5caf80BB5b32E43134' }] })
      .build()
    const safeInfo = { safe, safeAddress: safe.address.value }
    mockUseSafeInfo.mockReturnValue(safeInfo as any)

    const { result } = renderHook(() => useRecoveryDelayModifiers())

    // Give enough time for loading to occur, if it will
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    expect(result.current).toEqual([undefined, undefined, false])
    expect(mockGetRecoveryDelayModifiers).not.toHaveBeenCalledTimes(1)

    jest.useRealTimers()
  })

  it('should otherwise fetch', async () => {
    mockUseHasFeature.mockReturnValue(true)
    const provider = {}
    mockUseWeb3ReadOnly.mockReturnValue(provider as any)
    const chainId = '5'
    const safe = safeInfoBuilder()
      .with({ chainId, modules: [addressExBuilder().build()] })
      .build()
    const safeInfo = { safe, safeAddress: safe.address.value }
    mockUseSafeInfo.mockReturnValue(safeInfo as any)

    renderHook(() => useRecoveryDelayModifiers())

    expect(mockGetRecoveryDelayModifiers).toHaveBeenCalledTimes(1)
  })
})
