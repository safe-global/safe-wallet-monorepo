import type { HypernativeBatchAssessmentRequestDto } from '@safe-global/store/hypernative/hypernativeApi.dto'
import { isHexString } from 'ethers'

/**
 * Builds a Hypernative batch assessment request payload
 *
 * @param safeTxHashes - Array of transaction hashes
 * @returns HypernativeBatchAssessmentRequestDto or undefined if no valid hashes
 */
export const buildHypernativeBatchRequestData = (
  safeTxHashes: `0x${string}`[],
): HypernativeBatchAssessmentRequestDto | undefined => {
  // Validate and filter hashes
  const validHashes = safeTxHashes.filter((hash) => {
    return hash && isHexString(hash, 32) // 32 bytes = 64 hex chars + '0x' prefix = 66 chars
  }) as `0x${string}`[]

  // Ensure we have at least one valid hash (API requires non-empty array)
  if (validHashes.length === 0) {
    return undefined
  }

  return { safeTxHashes: validHashes }
}
