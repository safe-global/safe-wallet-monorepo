import { renderHook } from '@testing-library/react'
import useListSimilarityWarnings, { SIMILARITY_WARNING_TOOLTIP } from '../useListSimilarityWarnings'
import * as listSims from '../useListSimilarities'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { ListAnnotation, SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

jest.mock('../useListSimilarities')
const mockUseListSimilarities = listSims.default as jest.Mock

const IMPOSTOR = '0xA1B2ffffffffffffffffffffffffffffffff5678' // checksum-cased on purpose
const CLEAN = '0x7f3e9a01bc4d2e8f00112233445566778899aabb'
const match: SimilarityMatch = {
  anchor: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
  prefixLen: 4,
  suffixLen: 4,
  severity: Severity.CRITICAL,
}

const annotation = (address: string, m?: SimilarityMatch): ListAnnotation => ({ address, match: m })

describe('useListSimilarityWarnings', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the warning tooltip for a matched address, regardless of casing', () => {
    mockUseListSimilarities.mockReturnValue(new Map([[IMPOSTOR, annotation(IMPOSTOR, match)]]))
    const { result } = renderHook(() => useListSimilarityWarnings([IMPOSTOR]))
    // looked up with a different casing than the map key
    expect(result.current(IMPOSTOR.toLowerCase())).toBe(SIMILARITY_WARNING_TOOLTIP)
  })

  it('returns undefined for an address present but unmatched', () => {
    mockUseListSimilarities.mockReturnValue(new Map([[CLEAN, annotation(CLEAN)]]))
    const { result } = renderHook(() => useListSimilarityWarnings([CLEAN]))
    expect(result.current(CLEAN)).toBeUndefined()
  })

  it('returns undefined for an unknown address or undefined input', () => {
    mockUseListSimilarities.mockReturnValue(new Map<string, ListAnnotation>())
    const { result } = renderHook(() => useListSimilarityWarnings([]))
    expect(result.current('0x000000000000000000000000000000000000dead')).toBeUndefined()
    expect(result.current(undefined)).toBeUndefined()
  })
})
