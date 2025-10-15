import type { ContractAnalysisResults, RecipientAnalysisResults, ThreatAnalysisResult } from '../types'
import type { Severity } from '../types'
import type { AnalysisResult } from '../types'
import { getPrimaryResult } from './analysisUtils'
import { SEVERITY_TO_TITLE } from '../constants'

/**
 * Determines the overall security status by analyzing all available analysis results.
 *
 * This function aggregates recipient analysis, contract analysis, and threat analysis results
 * to compute a single overall severity status. It flattens all analysis results across all
 * addresses and groups, identifies the primary (highest severity) result, and returns a
 * standardized status object.
 * @param recipientResults - Optional recipient analysis results
 * @param contractResults - Optional contract analysis results
 * @param threatResults - Optional threat analysis result
 * @returns An object containing the overall severity level and corresponding title, or undefined
 *          if no analysis results are provided. The severity is determined by the most severe
 *          finding across all analysis types.
 * @example
 * ```typescript
 * const status = getOverallStatus(
 *   { '0xabc...': { ADDRESS_BOOK: [...], RECIPIENT_ACTIVITY: [...] } },
 *   { '0xdef...': { CONTRACT_VERIFICATION: [...] } },
 *   { type: 'HIGH_RISK', severity: 'ERROR', ... }
 * )
 * // Returns: { severity: 'ERROR', title: 'Critical Risk' }
 * ```
 */
export const getOverallStatus = (
  recipientResults?: RecipientAnalysisResults,
  contractResults?: ContractAnalysisResults,
  threatResults?: ThreatAnalysisResult,
): { severity: Severity; title: string } | undefined => {
  if (!recipientResults && !contractResults) {
    return undefined
  }

  // Flatten all AnalysisResult objects from contract, recipient, and threat into one array
  const allResults: AnalysisResult<any>[] = []

  // Add contract and recipient results
  for (const data of [contractResults, recipientResults]) {
    if (data) {
      for (const addressResults of Object.values(data)) {
        for (const groupResults of Object.values(addressResults)) {
          if (groupResults) {
            allResults.push(...groupResults)
          }
        }
      }
    }
  }

  // Add threat result
  if (threatResults) {
    allResults.push(threatResults)
  }

  const primaryResult = getPrimaryResult(allResults)

  if (primaryResult) {
    return { severity: primaryResult.severity, title: SEVERITY_TO_TITLE[primaryResult.severity] }
  }
}
