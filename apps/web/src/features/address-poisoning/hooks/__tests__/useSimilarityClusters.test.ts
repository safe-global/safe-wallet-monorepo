import { renderHook } from '@testing-library/react'
import { normalizeAddress } from '@safe-global/utils/utils/addressSimilarity'
import type { ListAnnotation } from '@safe-global/utils/utils/addressSimilarity.types'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import useSimilarityClusters from '../useSimilarityClusters'

let mockAnchor: Map<string, ListAnnotation> = new Map()
jest.mock('../useAnchorListMatches', () => ({ __esModule: true, default: () => mockAnchor }))

// front 1234 / back 5678
const REAL = '0x1234' + 'a'.repeat(32) + '5678'
// shares front 1234 with REAL → intra-list connects them
const IMPOSTOR = '0x1234' + 'b'.repeat(32) + '9999'
// unique front/back → no intra-list peer in these tests
const LONE = '0xcccc' + 'e'.repeat(32) + 'dddd'
const CLEAN = '0x' + '1'.repeat(40)
// not present in any test list
const OUT_OF_LIST_ANCHOR = '0xcccc' + 'f'.repeat(32) + '0000'

const anchorMatch = (address: string, anchor: string): [string, ListAnnotation] => [
  address.toLowerCase(),
  { address, match: { anchor: normalizeAddress(anchor), prefixLen: 4, suffixLen: 0, severity: Severity.WARN } },
]

describe('useSimilarityClusters', () => {
  beforeEach(() => {
    mockAnchor = new Map()
  })

  it('flags an in-list impostor AND its in-list trusted original, grouped together', () => {
    mockAnchor = new Map([anchorMatch(IMPOSTOR, REAL)])
    const { result } = renderHook(() => useSimilarityClusters([REAL, IMPOSTOR]))

    expect(result.current.flagged.has(REAL.toLowerCase())).toBe(true)
    expect(result.current.flagged.has(IMPOSTOR.toLowerCase())).toBe(true)
    const gid = result.current.groupIdByAddress.get(IMPOSTOR.toLowerCase())
    expect(gid).toBeDefined()
    expect(result.current.groupIdByAddress.get(REAL.toLowerCase())).toBe(gid)
  })

  it('flags an impostor of an out-of-list anchor per-row (flagged, no group id)', () => {
    mockAnchor = new Map([anchorMatch(LONE, OUT_OF_LIST_ANCHOR)])
    const { result } = renderHook(() => useSimilarityClusters([LONE, CLEAN]))

    expect(result.current.flagged.has(LONE.toLowerCase())).toBe(true)
    expect(result.current.flagged.has(CLEAN.toLowerCase())).toBe(false)
    expect(result.current.groupIdByAddress.has(LONE.toLowerCase())).toBe(false)
  })

  it('with no anchor matches (flag off), returns the pure intra-list result', () => {
    // intra-list still clusters REAL + IMPOSTOR (shared front-4)
    const grouped = renderHook(() => useSimilarityClusters([REAL, IMPOSTOR])).result.current
    expect(grouped.flagged.has(REAL.toLowerCase())).toBe(true)
    expect(grouped.flagged.has(IMPOSTOR.toLowerCase())).toBe(true)
    expect(grouped.groupIdByAddress.get(REAL.toLowerCase())).toBe(grouped.groupIdByAddress.get(IMPOSTOR.toLowerCase()))

    // two unrelated addresses → nothing flagged
    const none = renderHook(() => useSimilarityClusters([REAL, CLEAN])).result.current
    expect(none.flagged.size).toBe(0)
  })
})
