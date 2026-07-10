import type { SimilarityMatch } from '../../../utils/addressSimilarity.types'
import { checksumAddress } from '../../../utils/addresses'
import { type AnalysisResult, RecipientStatus, Severity } from '../types'

export type AddressPoisoningStatus = RecipientStatus.RESEMBLES_TRUSTED_ADDRESS

/**
 * Maps an address-poisoning similarity match onto a Copilot (SafeShield) analysis result.
 *
 * Any resemblance to a trusted anchor — whether both ends or a single end match — is surfaced as
 * one CRITICAL "Potential address poisoning" state. The card lists the entered address and the
 * trusted address it resembles so the user can compare them side by side.
 */
export function getAddressPoisoningResult({
  address,
  match,
  anchorName,
}: {
  address: string
  match: SimilarityMatch
  anchorName?: string
}): AnalysisResult<AddressPoisoningStatus> {
  const entered = checksumAddress(address)
  // match.anchor is normalized (lowercase, no `0x`); checksumAddress accepts a bare 40-hex string
  // and returns the proper `0x`-checksummed form.
  const anchor = checksumAddress(match.anchor)

  return {
    severity: Severity.CRITICAL,
    type: RecipientStatus.RESEMBLES_TRUSTED_ADDRESS,
    title: 'Potential address poisoning',
    description:
      'The address you entered looks similar to your saved address contact. Please verify before you proceed.',
    addresses: [{ address: entered }, { address: anchor, ...(anchorName ? { name: anchorName } : {}) }],
  }
}
