import { renderHook } from '@/tests/test-utils'
import useFlaggedSimilarAddresses from '../useFlaggedSimilarAddresses'
import type { ListAnnotation } from '@safe-global/utils/utils/addressSimilarity.types'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

let mockAnchor: Map<string, ListAnnotation>
jest.mock('../useAnchorListMatches', () => ({ __esModule: true, default: () => mockAnchor }))

const ANCHOR = '0x1111111111111111111111111111111111111111'
const IMPOSTOR = '0x2222222222222222222222222222222222222222'

describe('useFlaggedSimilarAddresses', () => {
  beforeEach(() => {
    mockAnchor = new Map()
  })

  it('flags both the impostor and the in-list trusted original it imitates', () => {
    mockAnchor = new Map([
      [
        IMPOSTOR.toLowerCase(),
        {
          address: IMPOSTOR,
          match: { anchor: ANCHOR.slice(2), prefixLen: 4, suffixLen: 4, severity: Severity.CRITICAL },
        },
      ],
    ])

    const { result } = renderHook(() => useFlaggedSimilarAddresses([ANCHOR, IMPOSTOR]))

    expect(result.current.has(IMPOSTOR.toLowerCase())).toBe(true)
    expect(result.current.has(ANCHOR.toLowerCase())).toBe(true)
  })

  it('still runs intra-list detection with no anchor matches (the flag-off path)', () => {
    // Two addresses sharing the visible front-4 AND back-4 → an intra-list collision.
    const a = '0x1234aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa5678'
    const b = '0x1234bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb5678'

    const { result } = renderHook(() => useFlaggedSimilarAddresses([a, b]))

    expect(result.current.has(a)).toBe(true)
    expect(result.current.has(b)).toBe(true)
  })

  it('flags nothing when there is no anchor match and the addresses are dissimilar', () => {
    const a = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    const b = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

    const { result } = renderHook(() => useFlaggedSimilarAddresses([a, b]))

    expect(result.current.size).toBe(0)
  })
})
