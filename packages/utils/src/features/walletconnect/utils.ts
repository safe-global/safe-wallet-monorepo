import { EIP155 } from './constants'

export const isPairingUri = (uri: string): boolean => {
  return uri.startsWith('wc:')
}

// Numeric chain id -> CAIP-2, e.g. '1' -> 'eip155:1'
export const getEip155ChainId = (chainId: string): string => {
  return `${EIP155}:${chainId}`
}

// CAIP-2 / CAIP-10 -> trailing segment, e.g. 'eip155:1' -> '1'
export const stripEip155Prefix = (eip155Address: string): string => {
  return eip155Address.split(':').pop() ?? ''
}

// Numeric chain id -> hex, e.g. '137' -> '0x89'
export const chainIdToHex = (chainId: string | number): string => {
  return '0x' + Number(chainId).toString(16)
}

// Splits "Summary: detail" into ['Summary', 'detail']; ['Summary'] when there is no detail.
export const splitError = (message: string): string[] => {
  return message.split(/: (.+)/).slice(0, 2)
}
