import { EIP155 } from './constants'

export const isPairingUri = (uri: string): boolean => {
  return uri.startsWith('wc:')
}

// Pull the pairing `wc:` URI out of a deep link: a bare `wc:` URI, or the mobile-linking envelope
// `safe://wc?uri=<encoded>` / `https://app.safe.global/wc?uri=<encoded>`. Null if there is none.
export const extractWcUri = (url: string): string | null => {
  if (isPairingUri(url)) {
    return url
  }
  try {
    const wrapped = new URL(url).searchParams.get('uri')
    return wrapped && isPairingUri(wrapped) ? wrapped : null
  } catch {
    return null
  }
}

// CAIP-2 chain id from a numeric chain id, e.g. '1' -> 'eip155:1'.
export const getEip155ChainId = (chainId: string): `${typeof EIP155}:${string}` => {
  return `${EIP155}:${chainId}`
}

// Integer (decimal or 0x-hex string, or number) -> canonical hex quantity, e.g. '137' -> '0x89'.
// Uses BigInt so values above 2^53 (e.g. block numbers / gas) don't lose precision.
export const toHex = (value: string | number): string => {
  return '0x' + BigInt(value).toString(16)
}

// CAIP-2 / CAIP-10 -> trailing segment, e.g. 'eip155:1' -> '1', 'eip155:1:0xabc' -> '0xabc'.
export const stripEip155Prefix = (eip155Address: string): string => {
  return eip155Address.split(':').pop() ?? ''
}
