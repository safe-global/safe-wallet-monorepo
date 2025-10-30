import { RecipientAnalysisResults, StatusGroup } from '../types'

/**
 * Filters the recipient addresses that are not Safe accounts according to analysis results.
 * Excludes addresses that already have RECIPIENT_ACTIVITY results (including FAILED status).
 */
export function filterNonSafeRecipients(analysisByAddress?: RecipientAnalysisResults): string[] {
  if (!analysisByAddress) {
    return []
  }

  return Object.keys(analysisByAddress).filter((address) => {
    const addressAnalysis = analysisByAddress[address]

    if (addressAnalysis?.isSafe === true || !!addressAnalysis?.[StatusGroup.RECIPIENT_ACTIVITY]) {
      return false
    }
    return true
  })
}
