import { renderHook } from '@testing-library/react'
import { getAddress } from 'ethers'
import { useAppSelector } from '@/store'
import { useHasFeature } from '@/hooks/useChains'
import { buildSimilarityIndex } from '@safe-global/utils/utils/addressSimilarity'
import useSimilarityGroups from '../useSimilarityGroups'

jest.mock('@/store', () => ({ useAppSelector: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ useHasFeature: jest.fn() }))
const mockUseAppSelector = useAppSelector as jest.Mock
const mockUseHasFeature = useHasFeature as jest.Mock

const ANCHOR = getAddress('0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678')
const CRITICAL = getAddress('0xa1b2000000000000000000000000000000005678') // shares a1b2 + 5678 with ANCHOR
const CLEAN = getAddress('0x1111111111111111111111111111111111111111')
// A pair that shares front (1234) AND back (5678) with each other but not with ANCHOR.
const PAIR_A = getAddress('0x1234000000000000000000000000000000005678')
const PAIR_B = getAddress('0x1234111111111111111111111111111111115678')

describe('useSimilarityGroups', () => {
  beforeEach(() => {
    mockUseAppSelector.mockReturnValue(buildSimilarityIndex([ANCHOR]))
    mockUseHasFeature.mockReturnValue(true)
  })

  it('returns nothing for an empty list', () => {
    const { result } = renderHook(() => useSimilarityGroups([]))
    expect(result.current.groups).toEqual([])
    expect(result.current.ungrouped).toEqual([])
  })

  it('returns everything ungrouped when the flag is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    const { result } = renderHook(() => useSimilarityGroups([CRITICAL, CLEAN]))
    expect(result.current.groups).toEqual([])
    expect(result.current.ungrouped).toEqual([CRITICAL, CLEAN])
  })

  it('leaves a clean address ungrouped', () => {
    const { result } = renderHook(() => useSimilarityGroups([CLEAN]))
    expect(result.current.groups).toEqual([])
    expect(result.current.ungrouped).toEqual([CLEAN])
  })

  it('frames an impostor together with the in-list anchor it resembles (critical)', () => {
    const { result } = renderHook(() => useSimilarityGroups([ANCHOR, CRITICAL, CLEAN]))
    expect(result.current.groups).toHaveLength(1)
    expect(result.current.groups[0].addresses).toEqual(expect.arrayContaining([ANCHOR, CRITICAL]))
    expect(result.current.groups[0].isCritical).toBe(true)
    expect(result.current.ungrouped).toEqual([CLEAN])
  })

  it('clusters an intra-list both-ends pair even without an anchor', () => {
    mockUseAppSelector.mockReturnValue(buildSimilarityIndex([]))
    const { result } = renderHook(() => useSimilarityGroups([PAIR_A, PAIR_B, CLEAN]))
    expect(result.current.groups).toHaveLength(1)
    expect(result.current.groups[0].addresses).toEqual(expect.arrayContaining([PAIR_A, PAIR_B]))
    expect(result.current.ungrouped).toEqual([CLEAN])
  })
})
