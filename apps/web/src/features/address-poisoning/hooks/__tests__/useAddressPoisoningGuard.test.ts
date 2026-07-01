import { renderHook, act } from '@testing-library/react'
import { getAddress } from 'ethers'
import useAddressPoisoningGuard from '../useAddressPoisoningGuard'
import * as sim from '../useAddressSimilarity'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

jest.mock('../useAddressSimilarity')
const mockUseAddressSimilarity = sim.default as jest.Mock

const ANCHOR_HEX = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const FLAGGED = '0xa1b2ffffffffffffffffffffffffffffffff5678' // shares 0xa1b2 + 5678
const MIDDLE = 'ffffffffffffffffffffffffffffffff' // splitAddress(FLAGGED).middle

const match = (severity: Severity): SimilarityMatch => ({
  anchor: ANCHOR_HEX,
  prefixLen: 4,
  suffixLen: severity === Severity.CRITICAL ? 4 : 0,
  severity,
})

describe('useAddressPoisoningGuard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('is not blocked and has no match for a clean address', () => {
    mockUseAddressSimilarity.mockReturnValue(null)
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: '0xclean' }))
    expect(result.current.level).toBe('none')
    expect(result.current.isBlocked).toBe(false)
  })

  it('amber (warn) blocks until acknowledged when amberBlocks=true', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.WARN))
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED }))
    expect(result.current.level).toBe('warn')
    expect(result.current.isBlocked).toBe(true)
    act(() => result.current.toggleAck())
    expect(result.current.isBlocked).toBe(false)
    expect(result.current.resolved?.kind).toBe('warn-override')
  })

  it('amber does not block when amberBlocks=false', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.WARN))
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED, amberBlocks: false }))
    expect(result.current.isBlocked).toBe(false)
  })

  it('critical blocks until the different-address path is fully verified (middle + ack)', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED }))
    expect(result.current.level).toBe('critical')
    expect(result.current.isBlocked).toBe(true)

    act(() => result.current.chooseDifferent())
    act(() => result.current.setMid('wrong'))
    act(() => result.current.toggleAck())
    expect(result.current.isBlocked).toBe(true) // middle still wrong

    act(() => result.current.setMid(MIDDLE))
    expect(result.current.midMatch).toBe(true)
    expect(result.current.isBlocked).toBe(false)
    expect(result.current.resolved?.kind).toBe('critical-override')
  })

  it('critical with requireReentry=false resolves on ack alone (no middle retype)', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED, requireReentry: false }))
    act(() => result.current.chooseDifferent())
    act(() => result.current.toggleAck())
    expect(result.current.isBlocked).toBe(false)
  })

  it('useTrusted writes the checksummed anchor address back to the field', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const onUseTrusted = jest.fn()
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED, onUseTrusted }))
    act(() => result.current.useTrusted())
    // Checksummed so the address book / name resolution keys match.
    expect(onUseTrusted).toHaveBeenCalledWith(getAddress('0x' + ANCHOR_HEX))
    expect(result.current.anchorAddress).toBe(getAddress('0x' + ANCHOR_HEX))
  })

  it('add-entity context does not offer the trusted swap', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED, context: 'add-entity' }))
    expect(result.current.allowTrusted).toBe(false)
  })

  it('recipient context offers the trusted swap', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED, context: 'recipient' }))
    expect(result.current.allowTrusted).toBe(true)
  })
})
