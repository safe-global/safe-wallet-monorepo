import { renderHook } from '@testing-library/react-native'
import { useMakeSafesWithChainId } from './useMakeSafesWithChainId'

const mockSelectAllChainsIds = jest.fn()

jest.mock('@/src/store/hooks', () => ({
  useAppSelector: (selector: () => unknown) => selector(),
}))

jest.mock('@/src/store/chains', () => ({
  selectAllChainsIds: () => mockSelectAllChainsIds(),
}))

describe('useMakeSafesWithChainId', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return comma-separated safe IDs for all chains', () => {
    mockSelectAllChainsIds.mockReturnValue(['1', '137', '10'])
    const safeAddress = '0x1234567890123456789012345678901234567890'

    const { result } = renderHook(() => useMakeSafesWithChainId(safeAddress))

    expect(result.current).toBe(`1:${safeAddress},137:${safeAddress},10:${safeAddress}`)
  })

  it('should return single safe ID when only one chain', () => {
    mockSelectAllChainsIds.mockReturnValue(['1'])
    const safeAddress = '0xSafeAddress'

    const { result } = renderHook(() => useMakeSafesWithChainId(safeAddress))

    expect(result.current).toBe('1:0xSafeAddress')
  })

  it('should return empty string when no chains', () => {
    mockSelectAllChainsIds.mockReturnValue([])
    const safeAddress = '0xSafeAddress'

    const { result } = renderHook(() => useMakeSafesWithChainId(safeAddress))

    expect(result.current).toBe('')
  })

  it('should update when safeAddress changes', () => {
    mockSelectAllChainsIds.mockReturnValue(['1', '137'])

    const { result, rerender } = renderHook(({ address }) => useMakeSafesWithChainId(address), {
      initialProps: { address: '0xFirstAddress' },
    })

    expect(result.current).toBe('1:0xFirstAddress,137:0xFirstAddress')

    rerender({ address: '0xSecondAddress' })

    expect(result.current).toBe('1:0xSecondAddress,137:0xSecondAddress')
  })

  it('should update when chainIds change', () => {
    mockSelectAllChainsIds.mockReturnValue(['1'])
    const safeAddress = '0xSafeAddress'

    const { result, rerender } = renderHook(() => useMakeSafesWithChainId(safeAddress))

    expect(result.current).toBe('1:0xSafeAddress')

    mockSelectAllChainsIds.mockReturnValue(['1', '56', '42161'])

    rerender({})

    expect(result.current).toBe('1:0xSafeAddress,56:0xSafeAddress,42161:0xSafeAddress')
  })

  it('should memoize result for same inputs', () => {
    mockSelectAllChainsIds.mockReturnValue(['1', '137'])
    const safeAddress = '0xSafeAddress'

    const { result, rerender } = renderHook(() => useMakeSafesWithChainId(safeAddress))

    const firstResult = result.current

    rerender({})

    expect(result.current).toBe(firstResult)
  })

  it('should handle various chain IDs', () => {
    mockSelectAllChainsIds.mockReturnValue(['1', '56', '137', '42161', '10', '8453'])
    const safeAddress = '0xTest'

    const { result } = renderHook(() => useMakeSafesWithChainId(safeAddress))

    expect(result.current).toBe('1:0xTest,56:0xTest,137:0xTest,42161:0xTest,10:0xTest,8453:0xTest')
  })
})
