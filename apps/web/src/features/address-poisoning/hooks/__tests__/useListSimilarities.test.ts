import { renderHook } from '@testing-library/react'
import { getAddress } from 'ethers'
import { useAppSelector } from '@/store'
import { buildSimilarityIndex } from '@safe-global/utils/utils/addressSimilarity'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import useListSimilarities from '../useListSimilarities'

jest.mock('@/store', () => ({ useAppSelector: jest.fn() }))
const mockUseAppSelector = useAppSelector as jest.Mock

const ANCHOR = getAddress('0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678')
const CRITICAL = getAddress('0xa1b2000000000000000000000000000000005678') // shares a1b2 + 5678
const WARN = getAddress('0xa1b2000000000000000000000000000000000000') // shares a1b2 only
const CLEAN = getAddress('0x1111111111111111111111111111111111111111')

describe('useListSimilarities', () => {
  beforeEach(() => {
    // Real engine index built from a single trusted anchor.
    mockUseAppSelector.mockReturnValue(buildSimilarityIndex([ANCHOR]))
  })

  it('returns an empty map for an empty list', () => {
    const { result } = renderHook(() => useListSimilarities([]))
    expect(result.current.size).toBe(0)
  })

  it('does not flag the anchor itself', () => {
    const { result } = renderHook(() => useListSimilarities([ANCHOR]))
    expect(result.current.get(ANCHOR)?.match).toBeUndefined()
  })

  it('does not flag a clean address', () => {
    const { result } = renderHook(() => useListSimilarities([CLEAN]))
    expect(result.current.get(CLEAN)?.match).toBeUndefined()
  })

  it('flags a both-ends look-alike as CRITICAL', () => {
    const { result } = renderHook(() => useListSimilarities([CRITICAL]))
    const match = result.current.get(CRITICAL)?.match
    expect(match?.severity).toBe(Severity.CRITICAL)
    expect(getAddress('0x' + match!.anchor)).toBe(ANCHOR)
  })

  it('flags a one-end look-alike as WARN', () => {
    const { result } = renderHook(() => useListSimilarities([WARN]))
    expect(result.current.get(WARN)?.match?.severity).toBe(Severity.WARN)
  })

  it('annotates the real anchor and the impostor together in one list', () => {
    const { result } = renderHook(() => useListSimilarities([ANCHOR, CRITICAL]))
    expect(result.current.get(ANCHOR)?.match).toBeUndefined() // the trusted original
    expect(result.current.get(CRITICAL)?.match?.severity).toBe(Severity.CRITICAL) // the impostor
  })
})
