import { renderHook } from '@testing-library/react'
import useSimilarAddressDetection from './useSimilarAddressDetection'
import * as store from '@/store'
import useAllSafes from '@/hooks/safes/useAllSafes'
import { buildSimilarityIndex } from '@safe-global/utils/utils/addressSimilarity'

jest.mock('@/store', () => ({
  useAppSelector: jest.fn(),
}))

jest.mock('@/hooks/safes/useAllSafes', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockUseAppSelector = store.useAppSelector as jest.Mock
const mockUseAllSafes = useAllSafes as unknown as jest.Mock

const TRUSTED = '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const LOOKALIKE = '0xa1b2ffffffffffffffffffffffffffffffff5678' // mimics TRUSTED 4+4
const UNRELATED = '0x7f3e9a01bc4d2e8f00112233445566778899aabb'

/** The hook reads the anchor index via useAppSelector; feed it a prebuilt one. */
const withAnchors = (anchors: string[]) => mockUseAppSelector.mockReturnValue(buildSimilarityIndex(anchors))

describe('useSimilarAddressDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAllSafes.mockReturnValue([])
  })

  it('returns empty when there is no input address', () => {
    withAnchors([TRUSTED])
    const { result } = renderHook(() => useSimilarAddressDetection(undefined))
    expect(result.current).toEqual({ hasSimilarAddress: false, similarAddresses: [] })
  })

  it('flags an address that resembles a trusted anchor', () => {
    withAnchors([TRUSTED])
    const { result } = renderHook(() => useSimilarAddressDetection(LOOKALIKE))
    expect(result.current.hasSimilarAddress).toBe(true)
    expect(result.current.similarAddresses).toEqual([{ address: TRUSTED.toLowerCase(), name: undefined }])
  })

  it('resolves the matched anchor name from the user safes', () => {
    withAnchors([TRUSTED])
    mockUseAllSafes.mockReturnValue([{ address: TRUSTED, name: 'My Safe' }])
    const { result } = renderHook(() => useSimilarAddressDetection(LOOKALIKE))
    expect(result.current.similarAddresses).toEqual([{ address: TRUSTED.toLowerCase(), name: 'My Safe' }])
  })

  it('does not flag an address unrelated to any anchor', () => {
    withAnchors([TRUSTED])
    const { result } = renderHook(() => useSimilarAddressDetection(UNRELATED))
    expect(result.current).toEqual({ hasSimilarAddress: false, similarAddresses: [] })
  })

  it('does NOT flag against attacker-injectable owned safes — the baseline is anchors only (Bug 2 fix)', () => {
    // No trusted anchors. An owned safe (from useAllSafes / CGW) resembles the viewed
    // address, but owned safes are NOT anchors, so there is nothing trusted to resemble.
    withAnchors([])
    mockUseAllSafes.mockReturnValue([{ address: LOOKALIKE, name: 'Attacker-owned' }])
    const { result } = renderHook(() => useSimilarAddressDetection(TRUSTED))
    expect(result.current.hasSimilarAddress).toBe(false)
  })
})
