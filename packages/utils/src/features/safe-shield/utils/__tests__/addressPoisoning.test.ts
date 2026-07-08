import { getAddressPoisoningResult } from '../addressPoisoning'
import { RecipientStatus, Severity, StatusGroup } from '../../types'
import { checksumAddress } from '../../../../utils/addresses'
import { shortenAddress } from '../../../../utils/formatters'
import type { SimilarityMatch } from '../../../../utils/addressSimilarity.types'

// Trusted anchor (Alice) and two look-alikes: one matching both ends, one only the suffix.
const ANCHOR = '0xa1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const BOTH_ENDS = '0xa1b2ffffffffffffffffffffffffffffffff5678'
const SUFFIX_ONLY = '0x9999888877776666555544443333222211115678'

const shortAnchor = shortenAddress(checksumAddress(ANCHOR))
const shortBothEnds = shortenAddress(checksumAddress(BOTH_ENDS))
const shortSuffixOnly = shortenAddress(checksumAddress(SUFFIX_ONLY))

const criticalMatch: SimilarityMatch = { anchor: ANCHOR, prefixLen: 4, suffixLen: 4, severity: Severity.CRITICAL }
const warnMatch: SimilarityMatch = { anchor: ANCHOR, prefixLen: 0, suffixLen: 4, severity: Severity.WARN }

describe('getAddressPoisoningResult', () => {
  it('adds an ADDRESS_POISONING status group', () => {
    expect(StatusGroup.ADDRESS_POISONING).toBe('ADDRESS_POISONING')
  })

  it('maps a both-ends match to the CRITICAL "Resembles a trusted address" state', () => {
    const result = getAddressPoisoningResult({ address: BOTH_ENDS, match: criticalMatch, anchorName: 'Alice' })

    expect(result.type).toBe(RecipientStatus.RESEMBLES_TRUSTED_ADDRESS)
    expect(result.severity).toBe(Severity.CRITICAL)
    expect(result.title).toBe('Resembles a trusted address')
    expect(result.description).toBe(
      `You entered ${shortBothEnds}. It looks like Alice (${shortAnchor}), an address you trust. Verify before you continue.`,
    )
  })

  it('maps a one-end match to the WARN "Partly matches a trusted address" state', () => {
    const result = getAddressPoisoningResult({ address: SUFFIX_ONLY, match: warnMatch, anchorName: 'Alice' })

    expect(result.type).toBe(RecipientStatus.PARTLY_MATCHES_TRUSTED_ADDRESS)
    expect(result.severity).toBe(Severity.WARN)
    expect(result.title).toBe('Partly matches a trusted address')
    expect(result.description).toBe(
      `${shortSuffixOnly} shares the visible characters with Alice (${shortAnchor}), an address you trust. Verify before you continue.`,
    )
  })

  it('falls back to the bare anchor address when no name is known', () => {
    const critical = getAddressPoisoningResult({ address: BOTH_ENDS, match: criticalMatch })
    expect(critical.description).toBe(
      `You entered ${shortBothEnds}. It looks like ${shortAnchor}, an address you trust. Verify before you continue.`,
    )

    const warn = getAddressPoisoningResult({ address: SUFFIX_ONLY, match: warnMatch })
    expect(warn.description).toBe(
      `${shortSuffixOnly} shares the visible characters with ${shortAnchor}, an address you trust. Verify before you continue.`,
    )
  })

  it('exposes both addresses (checksummed, anchor named) for rendering', () => {
    const result = getAddressPoisoningResult({ address: BOTH_ENDS, match: criticalMatch, anchorName: 'Alice' })

    expect(result.addresses).toEqual([
      { address: checksumAddress(BOTH_ENDS) },
      { address: checksumAddress(ANCHOR), name: 'Alice' },
    ])
  })
})
