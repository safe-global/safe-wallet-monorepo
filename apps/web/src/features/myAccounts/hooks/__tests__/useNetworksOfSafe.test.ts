import { renderHook } from '@testing-library/react'
import { useNetworksOfSafe } from '../useNetworksOfSafe'

const mockUseAllSafesGrouped = jest.fn()

jest.mock('@/hooks/safes', () => ({
  useAllSafesGrouped: (...args: unknown[]) => mockUseAllSafesGrouped(...args),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [] }),
}))

describe('useNetworksOfSafe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAllSafesGrouped.mockReturnValue({ allMultiChainSafes: [] })
  })

  // With no active Safe there are no networks to resolve, so the owned-safes enumeration is skipped.
  it('skips the owners enumeration when no safe address is provided', () => {
    renderHook(() => useNetworksOfSafe(''))

    expect(mockUseAllSafesGrouped).toHaveBeenCalledWith(undefined, false)
  })

  it('enumerates safes when a safe address is provided', () => {
    renderHook(() => useNetworksOfSafe('0x0000000000000000000000000000000000000123'))

    expect(mockUseAllSafesGrouped).toHaveBeenCalledWith(undefined, true)
  })
})
