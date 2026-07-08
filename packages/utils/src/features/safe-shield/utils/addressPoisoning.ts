import type { SimilarityMatch } from '../../../utils/addressSimilarity.types'
import { checksumAddress } from '../../../utils/addresses'
import { shortenAddress } from '../../../utils/formatters'
import { type AnalysisResult, RecipientStatus, Severity } from '../types'

export type AddressPoisoningStatus =
  | RecipientStatus.RESEMBLES_TRUSTED_ADDRESS
  | RecipientStatus.PARTLY_MATCHES_TRUSTED_ADDRESS

/**
 * Maps an address-poisoning similarity match onto a Copilot (SafeShield) analysis result.
 *
 * CRITICAL (both ends match a trusted anchor) → "Resembles a trusted address";
 * WARN (one end matches) → "Partly matches a trusted address".
 * The description names both the entered address and the trusted anchor it imitates.
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
  const anchor = checksumAddress(match.anchor)
  const shortEntered = shortenAddress(entered)
  const anchorLabel = anchorName ? `${anchorName} (${shortenAddress(anchor)})` : shortenAddress(anchor)
  const isCritical = match.severity === Severity.CRITICAL

  return {
    severity: isCritical ? Severity.CRITICAL : Severity.WARN,
    type: isCritical ? RecipientStatus.RESEMBLES_TRUSTED_ADDRESS : RecipientStatus.PARTLY_MATCHES_TRUSTED_ADDRESS,
    title: isCritical ? 'Resembles a trusted address' : 'Partly matches a trusted address',
    description: isCritical
      ? `You entered ${shortEntered}. It looks like ${anchorLabel}, an address you trust. Verify before you continue.`
      : `${shortEntered} shares the visible characters with ${anchorLabel}, an address you trust. Verify before you continue.`,
    addresses: [{ address: entered }, { address: anchor, ...(anchorName ? { name: anchorName } : {}) }],
  }
}
