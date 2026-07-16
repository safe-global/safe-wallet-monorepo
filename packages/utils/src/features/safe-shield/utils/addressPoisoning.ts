import { checksumAddress } from '../../../utils/addresses'
import { type AnalysisResult, RecipientStatus, Severity } from '../types'

export type AddressPoisoningStatus = RecipientStatus.RESEMBLES_TRUSTED_ADDRESS

/**
 * Maps a look-alike to a single CRITICAL "Potential address poisoning" result for the Copilot card
 * (the entered address + the trusted address it resembles).
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
