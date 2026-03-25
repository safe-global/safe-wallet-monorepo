import { Interface, type AbstractProvider } from 'ethers'
import { multicall } from '@safe-global/utils/utils/multicall'
import { logError } from '../exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'

// ENS Universal Resolver on Ethereum mainnet
// Handles both reverse resolution and forward verification in a single call
const UNIVERSAL_RESOLVER = '0xce01f8eee7E479C928F8919abD53E553a36CeF67'

const UNIVERSAL_RESOLVER_ABI = [
  'function reverse(bytes reverseName) view returns (string name, address resolvedAddress, address reverseResolver, address resolver)',
]

const iface = new Interface(UNIVERSAL_RESOLVER_ABI)

/**
 * DNS-encode a domain name (e.g. "abc123.addr.reverse" → length-prefixed labels + 0x00)
 * This follows the DNS wire format required by the ENS Universal Resolver.
 */
function dnsEncodeName(name: string): Uint8Array {
  const labels = name.split('.')
  const parts: number[] = []

  for (const label of labels) {
    const bytes = new TextEncoder().encode(label)
    parts.push(bytes.length, ...bytes)
  }
  parts.push(0)

  return new Uint8Array(parts)
}

/**
 * Build the reverse name for an address.
 * E.g. 0xABcD... → "abcd....addr.reverse"
 */
function toReverseName(address: string): Uint8Array {
  const name = `${address.slice(2).toLowerCase()}.addr.reverse`
  return dnsEncodeName(name)
}

/**
 * Batch-resolve ENS reverse names for multiple addresses using multicall.
 *
 * Returns a record mapping each input address to its ENS name (or null if none).
 * Uses the ENS Universal Resolver which performs both reverse resolution
 * and forward verification in a single call.
 */
export async function batchLookupAddresses(
  provider: AbstractProvider,
  addresses: string[],
): Promise<Record<string, string | null>> {
  const result: Record<string, string | null> = {}

  if (addresses.length === 0) return result

  const calls = addresses.map((address) => ({
    to: UNIVERSAL_RESOLVER,
    data: iface.encodeFunctionData('reverse', [toReverseName(address)]),
  }))

  try {
    const responses = await multicall(provider, calls)

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i]
      const response = responses[i]

      if (!response.success || response.returnData === '0x') {
        result[address] = null
        continue
      }

      try {
        const [name, resolvedAddress] = iface.decodeFunctionResult('reverse', response.returnData)

        // Verify the forward resolution matches the original address
        if (name && resolvedAddress.toLowerCase() === address.toLowerCase()) {
          result[address] = name
        } else {
          result[address] = null
        }
      } catch {
        result[address] = null
      }
    }
  } catch (e) {
    const err = e as Error
    logError(ErrorCodes._101, err.message)

    // On failure, mark all as null so they're still cached
    for (const address of addresses) {
      result[address] = null
    }
  }

  return result
}
