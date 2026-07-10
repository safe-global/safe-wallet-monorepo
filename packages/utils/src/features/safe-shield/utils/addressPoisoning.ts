import { checksumAddress } from '../../../utils/addresses'
import { type AnalysisResult, RecipientStatus, Severity } from '../types'

export type AddressPoisoningStatus = RecipientStatus.RESEMBLES_TRUSTED_ADDRESS

/**
 * Maps an address-poisoning look-alike onto a Copilot (SafeShield) analysis result.
 *
 * Any resemblance to a trusted anchor (front and/or back) is surfaced as one CRITICAL "Potential
 * address poisoning" state. The card lists the entered address and the trusted address it resembles
 * so the user can compare them side by side.
 */
export function getAddressPoisoningResult({
  address,
  anchor,
  anchorName,
}: {
  address: string
  /** The trusted anchor the entered address resembles, normalized (lowercase, no `0x`). */
  anchor: string
  anchorName?: string
}): AnalysisResult<AddressPoisoningStatus> {
  const entered = checksumAddress(address)
  // `anchor` is normalized (no `0x`); checksumAddress accepts a bare 40-hex string.
  const anchorAddress = checksumAddress(anchor)

  return {
    severity: Severity.CRITICAL,
    type: RecipientStatus.RESEMBLES_TRUSTED_ADDRESS,
    title: 'Potential address poisoning',
    description:
      'The address you entered looks similar to your saved address contact. Please verify before you proceed.',
    addresses: [{ address: entered }, { address: anchorAddress, ...(anchorName ? { name: anchorName } : {}) }],
  }
}
