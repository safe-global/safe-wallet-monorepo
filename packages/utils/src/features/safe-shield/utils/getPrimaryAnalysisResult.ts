import type {
  AnalysisResult,
  ContractAnalysisResults,
  GroupedAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { mapVisibleAnalysisResults, SEVERITY_PRIORITY } from '@safe-global/utils/features/safe-shield/utils'

type AnalysisData =
  | RecipientAnalysisResults
  | ContractAnalysisResults
  | ThreatAnalysisResults
  | Record<string, GroupedAnalysisResults>

export const getPrimaryAnalysisResult = (data: AnalysisData | undefined): AnalysisResult | undefined => {
  if (!data || Object.keys(data).length === 0) {
    return undefined
  }

  const visibleResults = mapVisibleAnalysisResults(
    data as RecipientAnalysisResults | ContractAnalysisResults | ThreatAnalysisResults,
  )

  if (!visibleResults.length) {
    return undefined
  }

  return visibleResults.reduce<AnalysisResult | undefined>((current, result) => {
    if (!current) {
      return result
    }

    return SEVERITY_PRIORITY[result.severity] < SEVERITY_PRIORITY[current.severity] ? result : current
  }, undefined)
}
