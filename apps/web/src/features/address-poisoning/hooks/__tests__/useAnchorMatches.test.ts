import { renderHook } from '@/tests/test-utils'
import useAnchorMatches from '../useAnchorMatches'
import type { ListAnnotation } from '@safe-global/utils/utils/addressSimilarity.types'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

let mockAnchor: Map<string, ListAnnotation>
jest.mock('../useListSimilarities', () => ({ __esModule: true, default: () => mockAnchor }))

const ANCHOR = '0x1111111111111111111111111111111111111111'
const IMPOSTOR = '0x2222222222222222222222222222222222222222'

describe('useAnchorMatches', () => {
  beforeEach(() => {
    mockAnchor = new Map()
  })

  it('maps each impostor to its match and collects the in-list originals being imitated', () => {
    mockAnchor = new Map([
      [
        IMPOSTOR.toLowerCase(),
        {
          address: IMPOSTOR,
          match: { anchor: ANCHOR.slice(2), prefixLen: 4, suffixLen: 4, severity: Severity.CRITICAL },
        },
      ],
    ])

    const { result } = renderHook(() => useAnchorMatches([ANCHOR, IMPOSTOR]))

    expect(result.current.anchorMatches.get(IMPOSTOR.toLowerCase())?.severity).toBe(Severity.CRITICAL)
    // The anchor is itself in the list → tracked so the grouping UI can box the pair together.
    expect(result.current.imitatedInList.has(ANCHOR.toLowerCase())).toBe(true)
  })

  it('leaves imitatedInList empty when the imitated anchor is not itself in the list', () => {
    mockAnchor = new Map([
      [
        IMPOSTOR.toLowerCase(),
        {
          address: IMPOSTOR,
          match: { anchor: ANCHOR.slice(2), prefixLen: 4, suffixLen: 4, severity: Severity.CRITICAL },
        },
      ],
    ])

    const { result } = renderHook(() => useAnchorMatches([IMPOSTOR]))

    expect(result.current.anchorMatches.has(IMPOSTOR.toLowerCase())).toBe(true)
    expect(result.current.imitatedInList.size).toBe(0)
  })

  it('is empty when there are no anchor matches', () => {
    const { result } = renderHook(() => useAnchorMatches([ANCHOR]))

    expect(result.current.anchorMatches.size).toBe(0)
    expect(result.current.imitatedInList.size).toBe(0)
  })
})
