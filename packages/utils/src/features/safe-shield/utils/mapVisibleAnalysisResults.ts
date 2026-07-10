import {
  type AnalysisResult,
  type GroupedAnalysisResults,
  ThreatStatus,
  MasterCopyChangeThreatAnalysisResult,
  ThreatAnalysisResult,
  ThreatAnalysisResults,
  ContractAnalysisResults,
  RecipientAnalysisResults,
  StatusGroup,
} from '../types'
import { getPrimaryResult, sortBySeverity } from './analysisUtils'
import { mapConsolidatedAnalysisResults } from './mapConsolidatedAnalysisResults'

/**
 * Maps address analysis results to visible analysis results for display, sorted by severity
 * For single addresses, returns primary results from each group
 * For multiple addresses, consolidates results by status type and generates appropriate descriptions
 * Results are sorted by severity: CRITICAL > WARN > INFO > OK
 */
// Metadata fields to exclude when extracting analysis result groups
// - name, logoUrl: present in ContractAnalysisResults entries (per-address metadata)
// - request_id: present in ThreatAnalysisResults (from Blockaid API x-request-id header)
// - BALANCE_CHANGE: present in ThreatAnalysisResults (handled separately, not a status group)
const METADATA_KEYS = ['name', 'logoUrl', 'request_id', 'BALANCE_CHANGE'] as const

export const mapVisibleAnalysisResults = (
  addressesResultsMap: RecipientAnalysisResults | ContractAnalysisResults | ThreatAnalysisResults,
  expandedGroups: StatusGroup[] = [],
): AnalysisResult[] => {
  // Filter out metadata fields that should not be treated as analysis result groups
  const addressResults: GroupedAnalysisResults[] = Object.entries(addressesResultsMap)
    .filter(([key]) => !METADATA_KEYS.includes(key as (typeof METADATA_KEYS)[number]))
    .map(([, value]) => value as GroupedAnalysisResults)

  if (addressResults.length === 1) {
    const results: AnalysisResult[] = []

    for (const [groupKey, groupResults] of Object.entries(addressResults[0])) {
      if (!Array.isArray(groupResults)) continue

      if (expandedGroups.includes(groupKey as StatusGroup)) {
        results.push(...sortBySeverity(groupResults as AnalysisResult[]))
        continue
      }

      const primaryGroupResult = getPrimaryResult<AnalysisResult>(groupResults)
      if (primaryGroupResult) {
        results.push(primaryGroupResult)
      }
    }
    return sortBySeverity(results.filter(Boolean))
  }

  // ADDRESS_POISONING is inherently per-address — each look-alike carries its own entered/anchor
  // pair for side-by-side comparison — so it must NOT be folded into a plural summary. Pull those
  // results out and keep them individual; consolidate every other group as before.
  const poisoningResults: AnalysisResult[] = []
  const consolidatable = addressResults.map((groups) => {
    const { [StatusGroup.ADDRESS_POISONING]: poisoning, ...rest } = groups
    if (Array.isArray(poisoning)) poisoningResults.push(...(poisoning as AnalysisResult[]))
    return rest as GroupedAnalysisResults
  })

  return sortBySeverity([...poisoningResults, ...mapConsolidatedAnalysisResults(addressesResultsMap, consolidatable)])
}

export const isAddressChange = (result: AnalysisResult): result is MasterCopyChangeThreatAnalysisResult => {
  return result.type === ThreatStatus.MASTERCOPY_CHANGE
}

export const isThreatAnalysisResult = (result: unknown): result is ThreatAnalysisResult => {
  if (
    typeof result === 'object' &&
    result !== null &&
    'severity' in result &&
    'type' in result &&
    'title' in result &&
    'description' in result
  ) {
    return true
  }

  return false
}
