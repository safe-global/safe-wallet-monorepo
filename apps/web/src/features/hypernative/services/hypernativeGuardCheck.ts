import { keccak256 } from 'ethers'
import type { JsonRpcProvider } from 'ethers'
import { logError, Errors } from '@/services/exceptions'

/**
 * Known code hashes for HypernativeGuard contracts
 * HypernativeGuard has the same bytecode across all chains
 *
 * Deployment example: Sepolia at 0x4784e9bF408F649D04A0a3294e87B0c74C5A3020
 */
export const HYPERNATIVE_GUARD_CODE_HASHES: string[] = [
  '0x1e1d445308b347e310f37bba7088b6d0d640faa626e0bbbba35296a1112f9b78', // HypernativeGuard v1
]

/**
 * Checks if a guard contract address is a HypernativeGuard
 * by comparing its bytecode hash against known HypernativeGuard code hashes
 *
 * @param guardAddress - The address of the guard contract to check
 * @param provider - Web3 provider to fetch contract bytecode
 * @returns Promise<boolean> - true if the guard is a HypernativeGuard, false otherwise
 */
export const isHypernativeGuard = async (
  guardAddress: string | null | undefined,
  provider: JsonRpcProvider | undefined,
): Promise<boolean> => {
  // Early returns for invalid inputs
  if (!guardAddress || !provider) {
    return false
  }

  // Check if we have known hashes
  if (HYPERNATIVE_GUARD_CODE_HASHES.length === 0) {
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
    return HYPERNATIVE_GUARD_CODE_HASHES.includes(codeHash)
  } catch (error) {
    logError(Errors._809, error)
    return false
  }
}
