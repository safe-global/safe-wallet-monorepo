import { renderHook } from '@testing-library/react'
import useListSimilarities from '../useListSimilarities'
import * as storeHooks from '@/store'
import * as useChains from '@/hooks/useChains'
import { buildSimilarityIndex } from '@safe-global/utils/utils/addressSimilarity'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

jest.mock('@/store', () => ({ useAppSelector: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ useHasFeature: jest.fn() }))

const mockUseAppSelector = storeHooks.useAppSelector as jest.Mock
const mockUseHasFeature = useChains.useHasFeature as jest.Mock

const TRUSTED = '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const IMPOSTOR = '0xa1b2ffffffffffffffffffffffffffffffff5678' // mimics TRUSTED 4+4
const UNRELATED = '0x7f3e9a01bc4d2e8f00112233445566778899aabb'

describe('useListSimilarities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHasFeature.mockReturnValue(true)
    mockUseAppSelector.mockReturnValue(buildSimilarityIndex([TRUSTED]))
  })

  it('annotates an impostor in the list and leaves unrelated/anchor entries unmarked', () => {
    const { result } = renderHook(() => useListSimilarities([TRUSTED, IMPOSTOR, UNRELATED]))
    expect(result.current.get(IMPOSTOR)?.match?.severity).toBe(Severity.CRITICAL)
    expect(result.current.get(IMPOSTOR)?.match?.anchor).toBe(TRUSTED.toLowerCase().slice(2))
    expect(result.current.get(TRUSTED)?.match).toBeUndefined()
    expect(result.current.get(UNRELATED)?.match).toBeUndefined()
  })

  it('returns an empty map when the feature flag is off', () => {
    mockUseHasFeature.mockReturnValue(false)
    const { result } = renderHook(() => useListSimilarities([IMPOSTOR]))
    expect(result.current.size).toBe(0)
  })

  it('returns an empty map for an empty list', () => {
    const { result } = renderHook(() => useListSimilarities([]))
    expect(result.current.size).toBe(0)
  })
})
