import { EIP155 } from './constants'

export const isPairingUri = (uri: string): boolean => {
  return uri.startsWith('wc:')
}

// CAIP-2 chain id from a numeric chain id, e.g. '1' -> 'eip155:1'.
export const getEip155ChainId = (chainId: string): `${typeof EIP155}:${string}` => {
  return `${EIP155}:${chainId}`
}

// Numeric chain id -> hex, e.g. '137' -> '0x89'
export const chainIdToHex = (chainId: string | number): string => {
  return '0x' + Number(chainId).toString(16)
}

// CAIP-2 / CAIP-10 -> trailing segment, e.g. 'eip155:1' -> '1', 'eip155:1:0xabc' -> '0xabc'.
export const stripEip155Prefix = (eip155Address: string): string => {
  return eip155Address.split(':').pop() ?? ''
}
