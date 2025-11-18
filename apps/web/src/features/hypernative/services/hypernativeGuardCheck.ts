import { keccak256 } from 'ethers'
import type { JsonRpcProvider } from 'ethers'
import memoize from 'lodash/memoize'
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
 * Internal implementation of the guard check.
 * Not exported - use the memoized version `isHypernativeGuard` instead.
 */
const _isHypernativeGuard = async (
  chainId: string | undefined,
  guardAddress: string | null | undefined,
  provider: JsonRpcProvider | undefined,
): Promise<boolean> => {
  // Early returns for invalid inputs
  if (!chainId || !guardAddress || !provider) {
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
    // Log error but don't cache the failure - let it be retried
    logError(Errors._809, error)
    throw error
  }
}

// Create a wrapper to handle memoization that doesn't cache errors
const _memoizedIsHypernativeGuard = memoize(
  _isHypernativeGuard,
  // Cache key resolver - use both chainId and guardAddress
  (chainId: string | undefined, guardAddress: string | null | undefined) =>
    `${chainId || 'null'}:${guardAddress || 'null'}`,
)

/**
 * Checks if a guard contract address is a HypernativeGuard
 * by comparing its bytecode hash against known HypernativeGuard code hashes.
 *
 * This function is memoized to avoid redundant RPC calls for the same guard address
 * on the same chain. The cache key includes both chainId and guardAddress because:
 * - Different chains may have different contracts at the same address
 * - Only successful lookups are cached (errors are not cached and will retry)
 *
 * @param chainId - The chain ID to check the guard on
 * @param guardAddress - The address of the guard contract to check
 * @param provider - Web3 provider to fetch contract bytecode
 * @returns Promise<boolean> - true if the guard is a HypernativeGuard, false otherwise
 * @throws Error if the provider fails to fetch bytecode (not cached, will retry)
 */
export const isHypernativeGuard = async (
  chainId: string | undefined,
  guardAddress: string | null | undefined,
  provider: JsonRpcProvider | undefined,
): Promise<boolean> => {
  const cacheKey = `${chainId || 'null'}:${guardAddress || 'null'}`

  try {
    return await _memoizedIsHypernativeGuard(chainId, guardAddress, provider)
  } catch (error) {
    // Remove the failed result from cache so it can be retried
    _memoizedIsHypernativeGuard.cache.delete?.(cacheKey)
    throw error
  }
}

// Expose cache for testing
isHypernativeGuard.cache = _memoizedIsHypernativeGuard.cache
