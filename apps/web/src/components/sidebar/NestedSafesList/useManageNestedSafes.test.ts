import { renderHook, act } from '@/tests/test-utils'
import { getAddress } from 'ethers'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { ListAnnotation } from '@safe-global/utils/utils/addressSimilarity.types'
import type { NestedSafeWithStatus } from '@/hooks/useNestedSafesVisibility'
import { useListSimilarities } from '@/features/address-poisoning'
import { useManageNestedSafes } from './useManageNestedSafes'

jest.mock('@/hooks/useSafeAddress', () => ({ __esModule: true, default: () => '0xParentSafe' }))
jest.mock('@/hooks/useCuratedNestedSafes', () => {
  // Stable reference across renders — a fresh [] each call retriggers the reset useEffect → infinite loop.
  const curatedAddresses: string[] = []
  return { useCuratedNestedSafes: () => ({ curatedAddresses, hasCompletedCuration: false }) }
})
// Mock only the anchor hook module (not the barrel — the test store depends on the real barrel).
jest.mock('@/features/address-poisoning/hooks/useListSimilarities', () => ({ __esModule: true, default: jest.fn() }))

const mockUseListSimilarities = useListSimilarities as jest.Mock

// Intra-list pair: share front (1234) AND back (5678) → old engine groups them.
const A = '0x1234' + '0'.repeat(32) + '5678'
const B = '0x1234' + '1'.repeat(32) + '5678'
// Anchor-only: resembles a trusted anchor not present in the list; no intra-list sibling.
const C = '0x9999' + '0'.repeat(32) + '9999'
const CLEAN = '0xabcd' + '0'.repeat(32) + 'abcd'
const ANCHOR_HEX = 'eeee' + '0'.repeat(32) + 'eeee' // normalized (no 0x), what C resembles

const safe = (address: string): NestedSafeWithStatus => ({ address, isValid: true, isCurated: false })

const anchorMap = (matches: Record<string, boolean>): Map<string, ListAnnotation> => {
  const map = new Map<string, ListAnnotation>()
  for (const [address, flagged] of Object.entries(matches)) {
    map.set(
      address,
      flagged
        ? { address, match: { anchor: ANCHOR_HEX, prefixLen: 4, suffixLen: 4, severity: Severity.CRITICAL } }
        : { address },
    )
  }
  return map
}

describe('useManageNestedSafes — anchor layered onto intra-list', () => {
  beforeEach(() => {
    mockUseListSimilarities.mockReturnValue(new Map<string, ListAnnotation>())
  })

  it('keeps the intra-list both-ends group unchanged (anchor engine off)', () => {
    const { result } = renderHook(() => useManageNestedSafes([safe(A), safe(B), safe(CLEAN)]))

    expect(result.current.isFlagged(A)).toBe(true)
    expect(result.current.isFlagged(B)).toBe(true)
    expect(result.current.isFlagged(CLEAN)).toBe(false)

    const intraGroup = result.current.groupedSafes.groups.find((g) => g.safes.length >= 2)
    expect(intraGroup?.safes.map((s) => s.address)).toEqual(expect.arrayContaining([A, B]))
    expect(result.current.getSimilarAddresses(A).map((a) => a.toLowerCase())).toEqual([B.toLowerCase()])
  })

  it('flags a nested safe that resembles a trusted anchor (front-or-back), not just intra-list pairs', () => {
    mockUseListSimilarities.mockReturnValue(anchorMap({ [C]: true, [CLEAN]: false }))

    const { result } = renderHook(() => useManageNestedSafes([safe(C), safe(CLEAN)]))

    expect(result.current.isFlagged(C)).toBe(true)
    expect(result.current.isFlagged(CLEAN)).toBe(false)
  })

  it('places an anchor-only match in its own group and names the trusted anchor as the similar address', () => {
    mockUseListSimilarities.mockReturnValue(anchorMap({ [C]: true, [CLEAN]: false }))

    const { result } = renderHook(() => useManageNestedSafes([safe(C), safe(CLEAN)]))

    const anchorGroup = result.current.groupedSafes.groups.find((g) => g.safes.some((s) => s.address === C))
    expect(anchorGroup).toBeDefined()
    expect(result.current.groupedSafes.ungrouped.map((s) => s.address)).toEqual([CLEAN])
    expect(result.current.getSimilarAddresses(C)).toEqual([getAddress('0x' + ANCHOR_HEX)])
  })

  it('requires confirmation before selecting an anchor-flagged safe', () => {
    mockUseListSimilarities.mockReturnValue(anchorMap({ [C]: true }))

    const { result } = renderHook(() => useManageNestedSafes([safe(C)]))

    act(() => result.current.toggleSafe(C))

    expect(result.current.pendingConfirmation).toBe(C.toLowerCase())
    expect(result.current.isSafeSelected(C)).toBe(false)
  })

  describe('anchor present in the list (suffix-only look-alike)', () => {
    // Two nested safes sharing only the trailing 5 chars — the reported bug. IMPOSTOR resembles the
    // curated ANCHOR; the old intra-list (front AND back) would miss this, anchor (front OR back) catches it.
    const IMPOSTOR = '0x' + 'eaaa' + '0'.repeat(31) + '558a4'
    const ANCHOR = '0x' + 'e0c3' + '1'.repeat(31) + '558a4'
    const anchorNorm = ANCHOR.slice(2).toLowerCase()

    beforeEach(() => {
      const map = new Map<string, ListAnnotation>()
      map.set(IMPOSTOR, {
        address: IMPOSTOR,
        match: { anchor: anchorNorm, prefixLen: 1, suffixLen: 5, severity: Severity.WARN },
      })
      map.set(ANCHOR, { address: ANCHOR }) // the trusted anchor is never itself flagged
      mockUseListSimilarities.mockReturnValue(map)
    })

    it('groups the impostor together with the in-list anchor it resembles', () => {
      const { result } = renderHook(() => useManageNestedSafes([safe(IMPOSTOR), safe(ANCHOR)]))

      const group = result.current.groupedSafes.groups.find((g) => g.safes.some((s) => s.address === IMPOSTOR))
      expect(group?.safes.map((s) => s.address)).toEqual(expect.arrayContaining([IMPOSTOR, ANCHOR]))
      expect(result.current.groupedSafes.ungrouped).toHaveLength(0)
    })

    it('exposes the real matched affix lengths for both rows (not a fixed 4)', () => {
      const { result } = renderHook(() => useManageNestedSafes([safe(IMPOSTOR), safe(ANCHOR)]))

      expect(result.current.getSimilarity(IMPOSTOR)?.suffixLen).toBe(5)
      expect(result.current.getSimilarity(ANCHOR)?.suffixLen).toBe(5) // anchor row highlighted vs the impostor
    })
  })

  describe('three or more mutually similar safes', () => {
    // REAL is curated; MAL1 shares only the suffix, MAL2 shares front AND suffix. All three collapse
    // into ONE group (A~REAL, MAL2~REAL transitively) — not separate pairs.
    const REAL = '0x' + 'e0c3' + '0'.repeat(31) + '558a4'
    const MAL1 = '0x' + 'aaaa' + '1'.repeat(31) + '558a4'
    const MAL2 = '0x' + 'e0c3' + '2'.repeat(31) + '558a4'
    const realNorm = REAL.slice(2).toLowerCase()

    beforeEach(() => {
      const map = new Map<string, ListAnnotation>()
      map.set(MAL1, { address: MAL1, match: { anchor: realNorm, prefixLen: 1, suffixLen: 5, severity: Severity.WARN } })
      map.set(MAL2, {
        address: MAL2,
        match: { anchor: realNorm, prefixLen: 4, suffixLen: 5, severity: Severity.CRITICAL },
      })
      map.set(REAL, { address: REAL })
      mockUseListSimilarities.mockReturnValue(map)
    })

    it('frames all three look-alikes in a single group', () => {
      const { result } = renderHook(() => useManageNestedSafes([safe(REAL), safe(MAL1), safe(MAL2)]))

      expect(result.current.groupedSafes.groups).toHaveLength(1)
      expect(result.current.groupedSafes.groups[0].safes.map((s) => s.address)).toEqual(
        expect.arrayContaining([REAL, MAL1, MAL2]),
      )
      expect(result.current.groupedSafes.ungrouped).toHaveLength(0)
    })

    it('keeps unrelated safes out of the group', () => {
      const { result } = renderHook(() => useManageNestedSafes([safe(REAL), safe(MAL1), safe(MAL2), safe(CLEAN)]))

      expect(result.current.groupedSafes.groups).toHaveLength(1)
      expect(result.current.groupedSafes.groups[0].safes).toHaveLength(3)
      expect(result.current.groupedSafes.ungrouped.map((s) => s.address)).toEqual([CLEAN])
    })

    it('marks the group critical when it contains a both-ends look-alike', () => {
      const { result } = renderHook(() => useManageNestedSafes([safe(REAL), safe(MAL1), safe(MAL2)]))

      // MAL2 shares front AND back with REAL → both-ends → the whole group is critical (red).
      expect(result.current.groupedSafes.groups[0].isCritical).toBe(true)
    })
  })

  describe('group severity (box tone)', () => {
    // Suffix-only look-alike of an in-list anchor → one-end → the group stays a warning (amber), not red.
    const SUF_ANCHOR = '0x' + '1234' + '0'.repeat(31) + 'abcde'
    const SUF_IMPOSTOR = '0x' + '9999' + '1'.repeat(31) + 'abcde'

    it('is not critical when every match is one-ended (suffix only)', () => {
      const map = new Map<string, ListAnnotation>()
      map.set(SUF_IMPOSTOR, {
        address: SUF_IMPOSTOR,
        match: { anchor: SUF_ANCHOR.slice(2).toLowerCase(), prefixLen: 1, suffixLen: 5, severity: Severity.WARN },
      })
      map.set(SUF_ANCHOR, { address: SUF_ANCHOR })
      mockUseListSimilarities.mockReturnValue(map)

      const { result } = renderHook(() => useManageNestedSafes([safe(SUF_IMPOSTOR), safe(SUF_ANCHOR)]))

      expect(result.current.groupedSafes.groups).toHaveLength(1)
      expect(result.current.groupedSafes.groups[0].isCritical).toBe(false)
    })
  })
})
