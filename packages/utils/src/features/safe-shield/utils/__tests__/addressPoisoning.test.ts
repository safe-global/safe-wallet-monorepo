import { getAddressPoisoningResult } from '../addressPoisoning'
import { RecipientStatus, Severity, StatusGroup } from '../../types'
import { checksumAddress } from '../../../../utils/addresses'
import { normalizeAddress } from '../../../../utils/addressSimilarity'
import type { SimilarityMatch } from '../../../../utils/addressSimilarity.types'

// Trusted anchor (Alice) and two look-alikes: one matching both ends, one only the suffix.
const ANCHOR = '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const BOTH_ENDS = '0xa1b2ffffffffffffffffffffffffffffffff5678'
const SUFFIX_ONLY = '0x9999888877776666555544443333222211115678'

// The engine emits `anchor` normalized (lowercase, no `0x`).
const bothEndsMatch: SimilarityMatch = {
  anchor: normalizeAddress(ANCHOR),
  prefixLen: 4,
  suffixLen: 4,
  severity: Severity.CRITICAL,
}
const oneEndMatch: SimilarityMatch = {
  anchor: normalizeAddress(ANCHOR),
  prefixLen: 0,
  suffixLen: 4,
  severity: Severity.WARN,
}

const DESCRIPTION =
  'The address you entered looks similar to your saved address contact. Please verify before you proceed.'

describe('getAddressPoisoningResult', () => {
  it('adds an ADDRESS_POISONING status group', () => {
    expect(StatusGroup.ADDRESS_POISONING).toBe('ADDRESS_POISONING')
  })

  it('maps a both-ends match to a single CRITICAL "Potential address poisoning" state', () => {
    const result = getAddressPoisoningResult({ address: BOTH_ENDS, match: bothEndsMatch, anchorName: 'Alice' })

    expect(result.type).toBe(RecipientStatus.RESEMBLES_TRUSTED_ADDRESS)
    expect(result.severity).toBe(Severity.CRITICAL)
    expect(result.title).toBe('Potential address poisoning')
    expect(result.description).toBe(DESCRIPTION)
  })

  it('maps a one-end match to the SAME CRITICAL state (no separate WARN tier)', () => {
    const result = getAddressPoisoningResult({ address: SUFFIX_ONLY, match: oneEndMatch, anchorName: 'Alice' })

    expect(result.type).toBe(RecipientStatus.RESEMBLES_TRUSTED_ADDRESS)
    expect(result.severity).toBe(Severity.CRITICAL)
    expect(result.title).toBe('Potential address poisoning')
    expect(result.description).toBe(DESCRIPTION)
  })

  it('exposes the entered and (named) anchor addresses, checksummed, for rendering', () => {
    const result = getAddressPoisoningResult({ address: BOTH_ENDS, match: bothEndsMatch, anchorName: 'Alice' })

    expect(result.addresses).toEqual([
      { address: checksumAddress(BOTH_ENDS) },
      { address: checksumAddress(ANCHOR), name: 'Alice' },
    ])
  })

  it('omits the anchor name when none is known', () => {
    const result = getAddressPoisoningResult({ address: BOTH_ENDS, match: bothEndsMatch })

    expect(result.addresses).toEqual([{ address: checksumAddress(BOTH_ENDS) }, { address: checksumAddress(ANCHOR) }])
  })
})
