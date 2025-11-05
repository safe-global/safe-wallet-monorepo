import { keccak256 } from 'ethers'
import type { JsonRpcProvider } from 'ethers'

/**
 * Known code hashes for HypernativeGuard contracts
 * These should be updated when new versions are deployed
 *
 * Example: Sepolia deployment at 0x4784e9bF408F649D04A0a3294e87B0c74C5A3020
 * Add more hashes as new deployments are made on different networks
 */
export const HYPERNATIVE_GUARD_CODE_HASHES: Record<string, string[]> = {
  // Sepolia testnet
  '11155111': [
    // Add the actual code hash for the Sepolia deployment here
    // This should be fetched once and hardcoded for performance
  ],
  // Add other networks as needed
  // '1': ['0x...'], // Mainnet
  // '137': ['0x...'], // Polygon
}

/**
 * Checks if a guard contract address is a HypernativeGuard
 * by comparing its bytecode hash against known HypernativeGuard code hashes
 *
 * @param guardAddress - The address of the guard contract to check
 * @param provider - Web3 provider to fetch contract bytecode
 * @param chainId - The chain ID where the guard is deployed
 * @returns Promise<boolean> - true if the guard is a HypernativeGuard, false otherwise
 */
export const isHypernativeGuard = async (
  guardAddress: string | null | undefined,
  provider: JsonRpcProvider | undefined,
  chainId: string,
): Promise<boolean> => {
  // Early returns for invalid inputs
  if (!guardAddress || !provider) {
    return false
  }

  // Check if we have known hashes for this chain
  const knownHashes = HYPERNATIVE_GUARD_CODE_HASHES[chainId]
  if (!knownHashes || knownHashes.length === 0) {
    return false
  }

  try {
    // Fetch the bytecode of the guard contract
    const code = await provider.getCode(guardAddress)

    // Check if code exists
    if (!code || code === '0x') {
      return false
    }

    // Hash the bytecode
    const codeHash = keccak256(code)

    // Check if the hash matches any known HypernativeGuard hashes
    return knownHashes.includes(codeHash)
  } catch (error) {
    console.error('[HypernativeGuard] Error checking guard contract:', error)
    return false
  }
}
