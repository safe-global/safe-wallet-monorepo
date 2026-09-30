import { parsePrefixedAddress } from '@safe-global/utils/utils/addresses'
import { isValidAddress } from '@safe-global/utils/utils/validation'

export type ScannedAddress = { address: string; prefix?: string }

// Shared error copy for the address-only scanners (Send, import-account). The WalletConnect scanner
// uses its own "Unrecognised QR code" message since it also accepts wc: URIs.
export const INVALID_ADDRESS_MESSAGE = 'Not a valid address'

// Recognises a scanned QR value as an Ethereum (optionally `prefix:`-tagged) address. Returns null
// for anything else — WalletConnect URIs, URLs, junk — so callers can fall back to their own
// handling. `parsePrefixedAddress` never throws (it leaves non-addresses unchanged), so feeding it
// arbitrary scanner output is safe. Single source of truth for what counts as a scannable address
// across every QR scanner.
export const resolveScannedAddress = (raw: string): ScannedAddress | null => {
  const { address, prefix } = parsePrefixedAddress(raw)
  return isValidAddress(address) ? { address, prefix } : null
}
