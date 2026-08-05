/** SLIP-44 coin type for Ethereum (ENSIP-9). */
export const ETH_COIN_TYPE = 60

const MAINNET_CHAIN_ID = 1
export const ENS_HUB_MAINNET = '1'
export const ENS_HUB_SEPOLIA = '11155111'

/**
 * Converts an EVM chain id to an ENS coin type.
 * Mainnet uses SLIP-44 coin type 60; other EVM chains use ENSIP-11 (`0x80000000 | chainId`).
 */
export const convertChainIdToCoinType = (chainId: number): number => {
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
