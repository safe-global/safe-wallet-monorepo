import type { JsonRpcProvider } from 'ethers'
import { isAddress } from 'ethers'

// Activity thresholds for scoring
export const ACTIVITY_THRESHOLDS = {
  VERY_LOW: 1,
  LOW: 5,
  MODERATE: 20,
  HIGH: 100,
} as const

export type AddressActivityAssessment = {
  txCount: number
  activityScore: number
}

/**
 * Calculate activity score based on transaction count
 * Returns a score from 0 to 1:
 * - 0: No activity (0 transactions)
 * - 0.1-0.3: Very low activity (1-4 transactions)
 * - 0.3-0.5: Low activity (5-19 transactions)
 * - 0.5-0.8: Moderate activity (20-99 transactions)
 * - 0.8-1.0: High activity (100+ transactions)
 */
const calculateActivityScore = (txCount: number): number => {
  if (txCount === 0) return 0
  if (txCount < ACTIVITY_THRESHOLDS.LOW) return 0.1 + (txCount / ACTIVITY_THRESHOLDS.LOW) * 0.2
  if (txCount < ACTIVITY_THRESHOLDS.MODERATE) return 0.3 + ((txCount - ACTIVITY_THRESHOLDS.LOW) / (ACTIVITY_THRESHOLDS.MODERATE - ACTIVITY_THRESHOLDS.LOW)) * 0.2
  if (txCount < ACTIVITY_THRESHOLDS.HIGH) return 0.5 + ((txCount - ACTIVITY_THRESHOLDS.MODERATE) / (ACTIVITY_THRESHOLDS.HIGH - ACTIVITY_THRESHOLDS.MODERATE)) * 0.3
  return Math.min(1.0, 0.8 + (txCount - ACTIVITY_THRESHOLDS.HIGH) / 1000 * 0.2)
}

/**
 * Analyzes address activity by checking transaction count
 * @param address - Ethereum address to analyze
 * @param web3ReadOnly - Web3 readonly provider instance
 * @returns Assessment of address activity
 */
export const analyzeAddressActivity = async (
  address: string,
  web3ReadOnly: JsonRpcProvider,
): Promise<AddressActivityAssessment> => {
  if (!isAddress(address)) {
    throw new Error('Invalid Ethereum address')
  }

  if (!web3ReadOnly) {
    throw new Error('Web3 provider not available')
  }

  try {
    // Get transaction count using eth_getTransactionCount
    const txCount = await web3ReadOnly.getTransactionCount(address, 'latest')

    // Calculate activity score
    const activityScore = calculateActivityScore(txCount)

    return {
      txCount,
      activityScore,
    }
  } catch (error) {
    throw new Error(`Failed to analyze address activity: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Determines if an address has low activity and might be lost/abandoned
 * @param assessment - Address activity assessment
 * @returns True if the address has suspiciously low activity
 */
export const isLowActivityAddress = (assessment: AddressActivityAssessment): boolean => {
  return assessment.activityScore < 0.3 || assessment.txCount < ACTIVITY_THRESHOLDS.LOW
}
