import type { AnalysisResult, AnyStatus, AddressAnalysisResults, StatusGroup } from '../types'
import { MULTI_RESULT_DESCRIPTION } from '../constants'
import { getPrimaryResult, sortBySeverity } from './analysisUtils'

type ConsolidatedResults<T extends AnyStatus = AnyStatus> = {
  [group in StatusGroup]?: { [type in T]?: AnalysisResult<T>[] }
}

/**
 * Consolidates multiple address analysis results by grouping them by status type
 * Generates appropriate multi-recipient descriptions for each group
 */
export const mapConsolidatedAnalysisResults = (
  addressResults: AddressAnalysisResults[],
): AnalysisResult<AnyStatus>[] => {
  const results: AnalysisResult<AnyStatus>[] = []

  const consolidatedResults = addressResults.reduce<ConsolidatedResults>((acc, currentAddressResults) => {
    for (const [group, groupResults] of Object.entries(currentAddressResults) as [
      StatusGroup,
      AnalysisResult<AnyStatus>[],
    ][]) {
      const primaryGroupResult = getPrimaryResult(groupResults || [])
      if (primaryGroupResult) {
        acc[group] = {
          ...(acc[group] || {}),
          [primaryGroupResult.type]: [...(acc[group]?.[primaryGroupResult.type] || []), primaryGroupResult],
        }
      }
    }
    return acc
  }, {})

  for (const groupResults of Object.values(consolidatedResults)) {
    const currentGroupResults = [] as AnalysisResult<AnyStatus>[]

    for (const [type, typeResults] of Object.entries(groupResults)) {
      const numResults = typeResults.length
      if (numResults > 0) {
        const formatPluralDescription =
          MULTI_RESULT_DESCRIPTION[type as keyof typeof MULTI_RESULT_DESCRIPTION] || (() => typeResults[0].description)
        currentGroupResults.push({
          severity: typeResults[0].severity,
          title: typeResults[0].title,
          type: type as AnyStatus,
          description: formatPluralDescription(numResults, addressResults.length),
        })
      }
    }

    const primaryGroupResult = getPrimaryResult(currentGroupResults)
    if (primaryGroupResult) {
      results.push(primaryGroupResult)
    }
  }

  return sortBySeverity(results.filter(Boolean))
}
