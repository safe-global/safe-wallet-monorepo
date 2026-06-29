import { renderHook, act } from '@testing-library/react'
import useAddressSimilarityGate from '../useAddressSimilarityGate'
import useAddressSimilarity from '../useAddressSimilarity'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

jest.mock('../useAddressSimilarity', () => ({ __esModule: true, default: jest.fn() }))

const mockUseAddressSimilarity = useAddressSimilarity as jest.Mock

const matchWith = (severity: Severity): SimilarityMatch => ({
  anchor: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
  prefixLen: 4,
  suffixLen: severity === Severity.CRITICAL ? 4 : 0,
  severity,
})

describe('useAddressSimilarityGate', () => {
  beforeEach(() => jest.clearAllMocks())

  it('is not blocked when there is no match', () => {
    mockUseAddressSimilarity.mockReturnValue(null)
    const { result } = renderHook(() => useAddressSimilarityGate('0xabc'))
    expect(result.current.match).toBeNull()
    expect(result.current.isBlocked).toBe(false)
  })

  it('surfaces a one-end (WARN) match without blocking', () => {
    mockUseAddressSimilarity.mockReturnValue(matchWith(Severity.WARN))
    const { result } = renderHook(() => useAddressSimilarityGate('0xabc'))
    expect(result.current.match?.severity).toBe(Severity.WARN)
    expect(result.current.isBlocked).toBe(false)
  })

  it('blocks on a CRITICAL match until acknowledged', () => {
    mockUseAddressSimilarity.mockReturnValue(matchWith(Severity.CRITICAL))
    const { result } = renderHook(() => useAddressSimilarityGate('0xabc'))
    expect(result.current.isBlocked).toBe(true)
    act(() => result.current.acknowledge())
    expect(result.current.isBlocked).toBe(false)
  })

  it('re-blocks when the address changes after acknowledging', () => {
    mockUseAddressSimilarity.mockReturnValue(matchWith(Severity.CRITICAL))
    const { result, rerender } = renderHook(({ addr }) => useAddressSimilarityGate(addr), {
      initialProps: { addr: '0xaaa' },
    })
    act(() => result.current.acknowledge())
    expect(result.current.isBlocked).toBe(false)
    rerender({ addr: '0xbbb' })
    expect(result.current.isBlocked).toBe(true)
  })
})
