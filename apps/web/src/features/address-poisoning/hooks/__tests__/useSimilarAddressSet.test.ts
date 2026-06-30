import { renderHook } from '@testing-library/react'
import useSimilarAddressSet from '../useSimilarAddressSet'
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

describe('useSimilarAddressSet', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns a lowercased set containing only the matched addresses', () => {
    mockUseListSimilarities.mockReturnValue(
      new Map([
        [IMPOSTOR, annotation(IMPOSTOR, match)],
        [CLEAN, annotation(CLEAN)],
      ]),
    )
    const { result } = renderHook(() => useSimilarAddressSet([IMPOSTOR, CLEAN]))
    expect(result.current.has(IMPOSTOR.toLowerCase())).toBe(true)
    expect(result.current.has(CLEAN.toLowerCase())).toBe(false)
    expect(result.current.size).toBe(1)
  })

  it('returns an empty set when there are no matches', () => {
    mockUseListSimilarities.mockReturnValue(new Map([[CLEAN, annotation(CLEAN)]]))
    const { result } = renderHook(() => useSimilarAddressSet([CLEAN]))
    expect(result.current.size).toBe(0)
  })
})
