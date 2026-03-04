import type {
  ContractAnalysisResults,
  ThreatAnalysisResults,
  RecipientAnalysisResults,
  DeadlockCheckResult,
} from '../types'
import { CommonSharedStatus, DeadlockStatus, Severity, ThreatStatus } from '../types'
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
 * @param hasSimulationError - Optional boolean indicating if the simulation has failed
 * @param hnLoginRequired - Optional boolean indicating if the Hypernative login is required
 * @param deadlockResult - Optional deadlock check result with status and reason
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
  hnLoginRequired?: boolean,
  deadlockResult?: DeadlockCheckResult,
): { severity: Severity; title: string } | undefined => {
  const hasDeadlock = deadlockResult?.status === DeadlockStatus.BLOCKED
  if (
    !recipientResults &&
    !contractResults &&
    !threatResults &&
    !hasSimulationError &&
    !hnLoginRequired &&
    !hasDeadlock
  ) {
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
            const results = groupResults.map((result) => ({
              ...result,
              title: SEVERITY_TO_TITLE[result.severity as Severity],
            })) as AnalysisResult[]
            allResults.push(...results)
          }
        }
      }
    }
  }

  // Add threat result (skip primitive values like request_id string)
  if (threatResults) {
    for (const addressResults of Object.values(threatResults)) {
      if (typeof addressResults !== 'object' || addressResults === null) continue
      for (const groupResults of Object.values(addressResults)) {
        if (groupResults && isThreatAnalysisResult(groupResults)) {
          allResults.push({ ...groupResults, title: SEVERITY_TO_TITLE[groupResults.severity as Severity] })
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

  if (hasDeadlock && deadlockResult) {
    allResults.push({
      severity: Severity.CRITICAL,
      title: SEVERITY_TO_TITLE[Severity.CRITICAL],
      type: CommonSharedStatus.FAILED,
      description: deadlockResult.reason || 'A signer deadlock was detected in the projected owner configuration.',
    })
  }

  if (hnLoginRequired) {
    allResults.push({
      severity: Severity.INFO,
      title: 'Authentication required',
      type: ThreatStatus.HYPERNATIVE_GUARD,
      description: 'Hypernative Guardian is active. Please login to continue.',
    })
  }

  const primaryResult = getPrimaryResult(allResults)

  if (primaryResult) {
    return {
      severity: primaryResult.severity,
      title: primaryResult.title || SEVERITY_TO_TITLE[primaryResult.severity as Severity],
    }
  }
}
