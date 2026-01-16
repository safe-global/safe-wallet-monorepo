import type { HypernativeBatchAssessmentRequestDto } from '@safe-global/store/hypernative/hypernativeApi.dto'
import { isHexString } from 'ethers'

/**
 * Type predicate to check if a value is a valid transaction hash
 * @param hash - Value to check
 * @returns True if hash is a valid `0x${string}` with 32 bytes (66 chars total)
 */
const isValidTxHash = (hash: unknown): hash is `0x${string}` => {
  return typeof hash === 'string' && hash.startsWith('0x') && isHexString(hash, 32)
}

/**
 * Builds a Hypernative batch assessment request payload
 *
 * @param safeTxHashes - Array of transaction hashes
 * @returns HypernativeBatchAssessmentRequestDto or undefined if no valid hashes
 */
export const buildHypernativeBatchRequestData = (
  safeTxHashes: `0x${string}`[],
): HypernativeBatchAssessmentRequestDto | undefined => {
  // Validate and filter hashes using type predicate
  const validHashes = safeTxHashes.filter(isValidTxHash)

  // Ensure we have at least one valid hash (API requires non-empty array)
  if (validHashes.length === 0) {
    return undefined
  }

  return { safeTxHashes: validHashes }
}
