import { EIP155 } from './constants'

export const isPairingUri = (uri: string): boolean => {
  return uri.startsWith('wc:')
}

// CAIP-2 chain id from a numeric chain id, e.g. '1' -> 'eip155:1'.
export const getEip155ChainId = (chainId: string): `${typeof EIP155}:${string}` => {
  return `${EIP155}:${chainId}`
}
