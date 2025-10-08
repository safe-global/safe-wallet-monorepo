import type { JsonRpcProvider } from 'ethers'
import { isAddress } from 'ethers'
import { ACTIVITY_THRESHOLDS } from './config'

export type ActivityLevel = 'NO_ACTIVITY' | 'VERY_LOW_ACTIVITY' | 'LOW_ACTIVITY' | 'MODERATE_ACTIVITY' | 'HIGH_ACTIVITY'

export type AddressActivityAssessment = {
  txCount: number
  activityLevel: ActivityLevel
}

/**
 * Determine activity level based on transaction count
 * @param txCount - Number of transactions
 * @returns Activity level category
 */
const getActivityLevel = (txCount: number): ActivityLevel => {
  if (txCount === 0) return 'NO_ACTIVITY'
  if (txCount < ACTIVITY_THRESHOLDS.LOW) return 'VERY_LOW_ACTIVITY'
  if (txCount < ACTIVITY_THRESHOLDS.MODERATE) return 'LOW_ACTIVITY'
  if (txCount < ACTIVITY_THRESHOLDS.HIGH) return 'MODERATE_ACTIVITY'
  return 'HIGH_ACTIVITY'
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

    // Determine activity level
    const activityLevel = getActivityLevel(txCount)

    return {
      txCount,
      activityLevel,
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
  return (
    assessment.activityLevel === 'NO_ACTIVITY' ||
    assessment.activityLevel === 'VERY_LOW_ACTIVITY' ||
    assessment.activityLevel === 'LOW_ACTIVITY'
  )
}
