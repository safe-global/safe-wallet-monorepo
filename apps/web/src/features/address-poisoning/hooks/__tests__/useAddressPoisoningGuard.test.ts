import { renderHook, act } from '@testing-library/react'
import { getAddress } from 'ethers'
import useAddressPoisoningGuard from '../useAddressPoisoningGuard'
import * as sim from '../useAddressSimilarity'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

jest.mock('../useAddressSimilarity')
const mockUseAddressSimilarity = sim.default as jest.Mock

const ANCHOR_HEX = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const ANCHOR = getAddress('0x' + ANCHOR_HEX)
const FLAGGED = '0xa1b2ffffffffffffffffffffffffffffffff5678' // shares 0xa1b2 + 5678

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
    expect(result.current.ack).toBe(true)
    expect(result.current.isBlocked).toBe(false)
  })

  it('amber does not block when amberBlocks=false', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.WARN))
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED, amberBlocks: false }))
    expect(result.current.isBlocked).toBe(false)
  })

  it('critical blocks until the attestation is ticked (ack alone unblocks)', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED }))
    expect(result.current.level).toBe('critical')
    expect(result.current.isBlocked).toBe(true)

    act(() => result.current.toggleAck())
    expect(result.current.ack).toBe(true)
    expect(result.current.isBlocked).toBe(false)
    // Ticking the attestation only unblocks — it never swaps to the trusted address.
    expect(result.current.usingTrusted).toBe(false)
  })

  it('resets the acknowledgement when the candidate address changes', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const { result, rerender } = renderHook(({ address }) => useAddressPoisoningGuard({ address }), {
      initialProps: { address: FLAGGED },
    })
    act(() => result.current.toggleAck())
    expect(result.current.ack).toBe(true)

    rerender({ address: '0xa1b2eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee5678' })
    expect(result.current.ack).toBe(false)
    expect(result.current.isBlocked).toBe(true)
  })

  it('useTrusted writes the checksummed anchor address back to the field', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const onUseTrusted = jest.fn()
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED, onUseTrusted }))
    act(() => result.current.useTrusted())
    // Checksummed so the address book / name resolution keys match.
    expect(onUseTrusted).toHaveBeenCalledWith(ANCHOR)
    expect(result.current.anchorAddress).toBe(ANCHOR)
  })

  it('reports usingTrusted once the field holds the swapped-in anchor', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const { result, rerender } = renderHook(({ address }) => useAddressPoisoningGuard({ address }), {
      initialProps: { address: FLAGGED },
    })
    act(() => result.current.useTrusted())
    // The host writes the anchor into the field; re-render with the new value.
    rerender({ address: ANCHOR })
    expect(result.current.usingTrusted).toBe(true)
  })

  it('undoTrusted restores the original candidate address', () => {
    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const onUseTrusted = jest.fn()
    const { result } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED, onUseTrusted }))
    act(() => result.current.useTrusted())
    onUseTrusted.mockClear()
    act(() => result.current.undoTrusted())
    expect(onUseTrusted).toHaveBeenCalledWith(FLAGGED)
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

  it('exposes the button-side hint per context and severity', () => {
    mockUseAddressSimilarity.mockReturnValue(null)
    const { result: clean } = renderHook(() => useAddressPoisoningGuard({ address: '0xclean' }))
    expect(clean.current.blockedHint).toBe('')

    mockUseAddressSimilarity.mockReturnValue(match(Severity.CRITICAL))
    const { result: recipient } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED, context: 'recipient' }))
    expect(recipient.current.blockedHint).toBe('Verify the recipient to continue')

    const { result: addEntity } = renderHook(() =>
      useAddressPoisoningGuard({ address: FLAGGED, context: 'add-entity' }),
    )
    expect(addEntity.current.blockedHint).toBe('Verify the address to continue')

    mockUseAddressSimilarity.mockReturnValue(match(Severity.WARN))
    const { result: warn } = renderHook(() => useAddressPoisoningGuard({ address: FLAGGED }))
    expect(warn.current.blockedHint).toBe('Confirm the address to continue')
  })
})
