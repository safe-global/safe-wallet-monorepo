import { keccak256, toUtf8Bytes } from 'ethers'
import type { JsonRpcProvider } from 'ethers'
import memoize from 'lodash/memoize'
import { logError, Errors } from '@/services/exceptions'
import HypernativeGuardAbi from './HypernativeGuard.abi.json'

/**
 * HypernativeGuard ABI interface
 * The deployment bytecode contains the Safe address, making each deployment unique.
 * Therefore, we compare the ABI (function selectors) instead of bytecode hashes.
 */
export const HYPERNATIVE_GUARD_ABI = HypernativeGuardAbi

/**
 * Key function selectors that uniquely identify the HypernativeGuard contract.
 * These are the function signatures that distinguish this guard from others.
 * We select a subset of distinctive functions that are unlikely to appear in other guards.
 */
const HYPERNATIVE_GUARD_DISTINCTIVE_FUNCTIONS = [
  'approveHash(bytes32)',
  'revokeHash(bytes32)',
  'approveNonceFreeHash(bytes32)',
  'revokeNonceFreeHash(bytes32)',
  'approveFunctionCallHash(bytes32)',
  'revokeFunctionCallHash(bytes32)',
  'getPolicyExtensions()',
  'addPolicyExtension(address)',
  'removePolicyExtension(address)',
  'KEEPER_ROLE()',
  'grantKeeperRole(address)',
  'revokeKeeperRole(address)',
  'activateTimelock()',
  'disableTimelock()',
  'isTimelockTriggered()',
  'getTimelockBlock()',
]

export const HYPERNATIVE_GUARD_FUNCTION_SELECTORS = HYPERNATIVE_GUARD_DISTINCTIVE_FUNCTIONS.map((sig) =>
  keccak256(toUtf8Bytes(sig)).slice(0, 10).toLowerCase(),
) // First 4 bytes (8 hex chars + 0x)

/**
 * Extracts function selectors from contract bytecode.
 * Function selectors are 4-byte signatures that appear in the bytecode.
 *
 * @param bytecode - The contract bytecode
 * @returns Set of function selectors found in the bytecode
 */
function extractFunctionSelectors(bytecode: string): Set<string> {
  const selectors = new Set<string>()

  // Remove 0x prefix if present
  const code = bytecode.startsWith('0x') ? bytecode.slice(2) : bytecode

  // Function selectors are 4 bytes (8 hex chars)
  // They typically appear after PUSH4 opcode (0x63) in the bytecode
  for (let i = 0; i < code.length - 8; i += 2) {
    const byte = code.slice(i, i + 2)

    // Check for PUSH4 opcode (0x63)
    if (byte === '63') {
      const selector = '0x' + code.slice(i + 2, i + 10).toLowerCase()
      selectors.add(selector)
    }
  }

  return selectors
}

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

    // Extract function selectors from the deployed bytecode
    const deployedSelectors = extractFunctionSelectors(code)

    // Check how many of our expected HypernativeGuard selectors are present
    let matchCount = 0
    for (const expectedSelector of HYPERNATIVE_GUARD_FUNCTION_SELECTORS) {
      if (deployedSelectors.has(expectedSelector)) {
        matchCount++
      }
    }

    // Require 100% of distinctive function selectors to match
    // If Hypernative releases a new version, we'll add a new ABI for it
    return matchCount === HYPERNATIVE_GUARD_FUNCTION_SELECTORS.length
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
 * Checks if a guard contract address is a HypernativeGuard
 * by extracting and comparing function selectors from its bytecode.
 *
 * Since the deployment bytecode of HypernativeGuard contains the Safe address,
 * each deployment has unique bytecode. Therefore, we verify the contract by
 * extracting function selectors (4-byte signatures) from the deployed bytecode
 * and matching them against the known HypernativeGuard function selectors.
 *
 * This approach is more efficient than making multiple RPC calls to test individual
 * functions, and more reliable than comparing full bytecode hashes.
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
