import {
  type AnalysisResult,
  type AnyStatus,
  type AddressAnalysisResults,
  ThreatStatus,
  MasterCopyChangeThreatAnalysisResult,
} from '../types'
import { getPrimaryResult, sortBySeverity } from './analysisUtils'
import { mapConsolidatedAnalysisResults } from './mapConsolidatedAnalysisResults'

/**
 * Maps address analysis results to visible analysis results for display, sorted by severity
 * For single addresses, returns primary results from each group
 * For multiple addresses, consolidates results by status type and generates appropriate descriptions
 * Results are sorted by severity: CRITICAL > WARN > INFO > OK
 */
export const mapVisibleAnalysisResults = (addressResults: AddressAnalysisResults[]): AnalysisResult<AnyStatus>[] => {
  if (addressResults.length === 1) {
    const results: AnalysisResult<AnyStatus>[] = []
    for (const groupResults of Object.values(addressResults[0])) {
      const primaryGroupResult = getPrimaryResult(groupResults)
      if (primaryGroupResult) {
        results.push(primaryGroupResult)
      }
    }
    return sortBySeverity(results.filter(Boolean))
  }

  return mapConsolidatedAnalysisResults(addressResults)
}

export const isAddressChange = (result: AnalysisResult<AnyStatus>): result is MasterCopyChangeThreatAnalysisResult => {
  return result.type === ThreatStatus.MASTER_COPY_CHANGE
}
