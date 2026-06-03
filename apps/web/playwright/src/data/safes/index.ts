/**
 * Test Safe registry — single import point.
 *
 * Usage:
 *   import { staticSafes, parseSafeAddress } from '../data/safes'
 *   const rawAddress = parseSafeAddress(staticSafes.SEP_STATIC_SAFE_2)
 *   await homePage.goto(staticSafes.SEP_STATIC_SAFE_2)
 */
export { staticSafes, type StaticSafeKey } from './static'

/**
 * Parse a prefixed Safe address ('sep:0xABC...') into its raw address ('0xABC...').
 * Throws on malformed input — catches bad registry entries early.
 */
export function parseSafeAddress(prefixedAddress: string): string {
  const parts = prefixedAddress.split(':')
  if (parts.length !== 2 || !parts[1].startsWith('0x') || parts[1].length !== 42) {
    throw new Error(
      `Malformed Safe address: "${prefixedAddress}". Expected format: "network:0x..." (42-char hex address)`,
    )
  }
  return parts[1]
}
