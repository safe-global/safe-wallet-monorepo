import type { JsonRpcProvider } from 'ethers'

/** SLIP-44 coin type for Ethereum (ENSIP-9). */
export const ETH_COIN_TYPE = 60

// Immutable network ids, spelled literally to keep this module dependency-free
// (it is also consumed by apps that don't depend on @safe-global/protocol-kit)
const MAINNET_CHAIN_ID = 1
export const ENS_HUB_MAINNET = '1'
export const ENS_HUB_SEPOLIA = '11155111'

// ENSIP-11 reserves the most significant bit as the EVM marker, so only chain ids
// below 0x80000000 can be represented as a coin type
const ENSIP11_MAX_CHAIN_ID = 0x80000000

/**
 * Converts an EVM chain id to an ENS coin type.
 * Mainnet uses SLIP-44 coin type 60; other EVM chains use ENSIP-11 (`0x80000000 | chainId`).
 * Returns undefined for chain ids ENSIP-11 cannot represent.
 */
export const convertChainIdToCoinType = (chainId: number): number | undefined => {
  if (!Number.isInteger(chainId) || chainId <= 0 || chainId >= ENSIP11_MAX_CHAIN_ID) {
    return undefined
  }

  if (chainId === MAINNET_CHAIN_ID) {
    return ETH_COIN_TYPE
  }

  return (0x80000000 | chainId) >>> 0
}

/**
 * ENS resolution always starts on a hub chain (Universal Resolver).
 * Production names resolve on Ethereum Mainnet; testnet names on Sepolia.
 */
export const getEnsHubChainId = (isTestnet: boolean): string => {
  return isTestnet ? ENS_HUB_SEPOLIA : ENS_HUB_MAINNET
}

/**
 * Forward-resolve an ENS name for a target chain via a hub provider (Mainnet/Sepolia).
 * Tries the chain-specific coin type first, then falls back to ETH (60) so names that only
 * set a mainnet addr record still work on L2s (or whose chain id has no ENSIP-11 coin type).
 */
export const resolveNameForChain = async (
  hubProvider: Pick<JsonRpcProvider, 'resolveName'>,
  name: string,
  targetChainId: number,
): Promise<string | null> => {
  const coinType = convertChainIdToCoinType(targetChainId)
  const address = coinType === undefined ? null : await hubProvider.resolveName(name, coinType)
  if (address || coinType === ETH_COIN_TYPE) {
    return address
  }

  return hubProvider.resolveName(name, ETH_COIN_TYPE)
}
