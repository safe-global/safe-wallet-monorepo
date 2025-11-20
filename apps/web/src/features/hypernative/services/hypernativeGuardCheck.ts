import { Interface, type FunctionFragment } from 'ethers'
import type { JsonRpcProvider } from 'ethers'
import memoize from 'lodash/memoize'
import { logError, Errors } from '@/services/exceptions'
import HypernativeGuardAbi from './HypernativeGuard.abi.json'

/**
 * HypernativeGuard ABI
 */
export const HYPERNATIVE_GUARD_ABI = HypernativeGuardAbi

/**
 * Interface instance to extract function selectors
 */
const HYPERNATIVE_GUARD_INTERFACE = new Interface(HypernativeGuardAbi)

/**
 * Extract all function selectors from the ABI.
 * Similar to how ERC20 approvals are detected using APPROVAL_SIGNATURE_HASH.
 */
export const HYPERNATIVE_GUARD_FUNCTION_SELECTORS = HYPERNATIVE_GUARD_INTERFACE.fragments
  .filter((fragment): fragment is FunctionFragment => fragment.type === 'function')
  .map((fragment) => HYPERNATIVE_GUARD_INTERFACE.getFunction(fragment.name)!.selector.toLowerCase())

/**
 * Internal implementation of the guard check.
 * Not exported - use the memoized version `isHypernativeGuard` instead.
 */
const _isHypernativeGuard = async (
  chainId: string | undefined,
  guardAddress: string | null | undefined,
  provider: JsonRpcProvider | undefined,
  skipAbiCheck: boolean = false,
): Promise<boolean> => {
  // Early returns for invalid inputs
  if (!chainId || !guardAddress || !provider) {
    return false
  }

  try {
    // Fetch the bytecode of the guard contract
    const code = await provider.getCode(guardAddress)

    // Check if code exists
    if (!code || code === '0x') {
      return false
    }

    // If feature flag is enabled, skip ABI check and just verify ANY guard is present
    if (skipAbiCheck) {
      // Contract has code, so a guard is present
      return true
    }

    // Check if all distinctive function selectors are present in the bytecode
    // This is similar to how we detect ERC20 approvals by checking for function selectors
    const lowerCode = code.toLowerCase()
    for (const selector of HYPERNATIVE_GUARD_FUNCTION_SELECTORS) {
      if (!lowerCode.includes(selector.slice(2))) {
        // slice(2) to remove '0x' prefix for includes check
        return false
      }
    }

    return true
  } catch (error) {
    // Log error but don't cache the failure - let it be retried
    logError(Errors._809, error)
    throw error
  }
}

// Create a wrapper to handle memoization that doesn't cache errors
const _memoizedIsHypernativeGuard = memoize(
  _isHypernativeGuard,
  // Cache key resolver - use chainId, guardAddress, and skipAbiCheck flag
  (
    chainId: string | undefined,
    guardAddress: string | null | undefined,
    _provider: JsonRpcProvider | undefined,
    skipAbiCheck: boolean = false,
  ) => `${chainId || 'null'}:${guardAddress || 'null'}:${skipAbiCheck}`,
)

/**
 * Checks if a guard contract address is a HypernativeGuard by checking if its bytecode
 * contains all the distinctive function selectors.
 *
 * Since the deployment bytecode of HypernativeGuard contains the Safe address,
 * each deployment has unique bytecode. Therefore, we verify the contract by checking
 * if the bytecode contains all expected function selectors (4-byte signatures).
 *
 * This approach is similar to how ERC20 approvals are detected in ApprovalEditor
 * using APPROVAL_SIGNATURE_HASH. It only requires one RPC call (getCode) and is
 * more reliable than comparing full bytecode hashes.
 *
 * Feature Flag: FEATURES.HYPERNATIVE_NO_ABI_CHECK
 * When enabled via useHasFeature, this function will skip the ABI check and simply
 * verify that ANY guard contract is present at the address. This provides a fallback
 * mechanism if the ABI-based detection encounters issues.
 *
 * This function is memoized to avoid redundant RPC calls for the same guard address
 * on the same chain. The cache key includes chainId, guardAddress, and skipAbiCheck because:
 * - Different chains may have different contracts at the same address
 * - The flag value affects the result
 * - Only successful lookups are cached (errors are not cached and will retry)
 *
 * @param chainId - The chain ID to check the guard on
 * @param guardAddress - The address of the guard contract to check
 * @param provider - Web3 provider to fetch contract bytecode
 * @param skipAbiCheck - When true, skips ABI verification and accepts any guard
 * @returns Promise<boolean> - true if the guard is a HypernativeGuard (or any guard if skipAbiCheck is true), false otherwise
 * @throws Error if the provider fails to fetch bytecode (not cached, will retry)
 */
export const isHypernativeGuard = async (
  chainId: string | undefined,
  guardAddress: string | null | undefined,
  provider: JsonRpcProvider | undefined,
  skipAbiCheck: boolean = false,
): Promise<boolean> => {
  const cacheKey = `${chainId || 'null'}:${guardAddress || 'null'}:${skipAbiCheck}`

  try {
    return await _memoizedIsHypernativeGuard(chainId, guardAddress, provider, skipAbiCheck)
  } catch (error) {
    // Remove the failed result from cache so it can be retried
    _memoizedIsHypernativeGuard.cache.delete?.(cacheKey)
    throw error
  }
}

// Expose cache for testing
isHypernativeGuard.cache = _memoizedIsHypernativeGuard.cache
