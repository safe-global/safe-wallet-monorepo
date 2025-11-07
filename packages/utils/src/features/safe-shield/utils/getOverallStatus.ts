import type { ContractAnalysisResults, ThreatAnalysisResults, RecipientAnalysisResults } from '../types'
import { CommonSharedStatus, Severity } from '../types'
import type { AnalysisResult } from '../types'
import { getPrimaryResult } from './analysisUtils'
import { SEVERITY_TO_TITLE } from '../constants'
import { isThreatAnalysisResult } from './mapVisibleAnalysisResults'

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
  threatResults?: ThreatAnalysisResults,
  hasSimulationError?: boolean,
): { severity: Severity; title: string } | undefined => {
  if (!recipientResults && !contractResults && !threatResults && !hasSimulationError) {
    return undefined
  }

  // Flatten all AnalysisResult objects from contract, recipient, and threat into one array
  const allResults: AnalysisResult[] = []

  // Add contract and recipient results
  for (const data of [contractResults, recipientResults]) {
    if (data) {
      for (const addressResults of Object.values(data)) {
        for (const groupResults of Object.values(addressResults)) {
          if (!Array.isArray(groupResults)) continue
          if (groupResults) {
            allResults.push(...(groupResults as AnalysisResult[]))
          }
        }
      }
    }
  }

  // Add threat result
  if (threatResults) {
    for (const addressResults of Object.values(threatResults)) {
      for (const groupResults of Object.values(addressResults)) {
        if (groupResults && isThreatAnalysisResult(groupResults)) {
          allResults.push(groupResults)
        }
      }
    }
  }

  if (hasSimulationError) {
    allResults.push({
      severity: Severity.WARN,
      title: SEVERITY_TO_TITLE[Severity.WARN],
      type: CommonSharedStatus.FAILED,
      description: 'Tenderly simulation failed',
    })
  }

  const primaryResult = getPrimaryResult(allResults)

  if (primaryResult) {
    return { severity: primaryResult.severity, title: SEVERITY_TO_TITLE[primaryResult.severity] }
  }
}
