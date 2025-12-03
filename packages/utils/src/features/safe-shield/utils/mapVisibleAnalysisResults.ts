import {
  type AnalysisResult,
  type GroupedAnalysisResults,
  ThreatStatus,
  MasterCopyChangeThreatAnalysisResult,
  ThreatAnalysisResult,
  ThreatAnalysisResults,
  ContractAnalysisResults,
  RecipientAnalysisResults,
} from '../types'
import { getPrimaryResult, sortBySeverity } from './analysisUtils'
import { mapConsolidatedAnalysisResults } from './mapConsolidatedAnalysisResults'

/**
 * Maps address analysis results to visible analysis results for display, sorted by severity
 * For single addresses, returns primary results from each group
 * For multiple addresses, consolidates results by status type and generates appropriate descriptions
 * Results are sorted by severity: CRITICAL > WARN > INFO > OK
 */
export const mapVisibleAnalysisResults = (
  addressesResultsMap: RecipientAnalysisResults | ContractAnalysisResults | ThreatAnalysisResults,
): AnalysisResult[] => {
  const {
    name: _name,
    logoUrl: _logoUrl,
    request_id: _requestId,
    ...resultsMap
  } = addressesResultsMap as ContractAnalysisResults & { request_id?: string }
  const addressResults: GroupedAnalysisResults[] = Object.values(resultsMap)

  if (addressResults.length === 1) {
    const results: AnalysisResult[] = []

    for (const groupResults of Object.values(addressResults[0])) {
      if (!Array.isArray(groupResults)) continue
      const primaryGroupResult = getPrimaryResult<AnalysisResult>(groupResults)
      if (primaryGroupResult) {
        results.push(primaryGroupResult)
      }
    }
    return sortBySeverity(results.filter(Boolean))
  }

  return mapConsolidatedAnalysisResults(addressesResultsMap, addressResults)
}

export const isAddressChange = (result: AnalysisResult): result is MasterCopyChangeThreatAnalysisResult => {
  return result.type === ThreatStatus.MASTERCOPY_CHANGE
}

export const isThreatAnalysisResult = (result: any): result is ThreatAnalysisResult => {
  if (result && 'severity' in result && 'type' in result && 'title' in result && 'description' in result) {
    return true
  }

  return false
}
