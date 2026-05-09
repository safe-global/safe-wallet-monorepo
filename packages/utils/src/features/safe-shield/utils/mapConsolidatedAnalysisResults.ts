import type {
  AnalysisResult,
  AnyStatus,
  GroupedAnalysisResults,
  StatusGroup,
  FallbackHandlerDetails,
  ContractDetails,
} from '../types'
import { ContractStatus } from '../types'
import { MULTI_RESULT_DESCRIPTION } from '../constants'
import { getPrimaryResult, sortBySeverity } from './analysisUtils'
import { RecipientAnalysisResults, ContractAnalysisResults, ThreatAnalysisResults } from '../types'

interface ConsolidatedAnalysisResult<T extends AnyStatus = AnyStatus> extends Omit<AnalysisResult<T>, 'addresses'> {
  addresses: string[]
}

type ConsolidatedResults<T extends AnyStatus = AnyStatus> = {
  [group in StatusGroup]?: { [type in T]?: ConsolidatedAnalysisResult<T>[] }
}

/**
 * Consolidates multiple address analysis results by grouping them by status type
 * Generates appropriate multi-recipient descriptions for each group
 */
export const mapConsolidatedAnalysisResults = (
  addressesResultsMap: RecipientAnalysisResults | ContractAnalysisResults | ThreatAnalysisResults,
  addressResults: GroupedAnalysisResults[],
): AnalysisResult[] => {
  const results: AnalysisResult[] = []
  const addresses = Object.keys(addressesResultsMap)

  /**
   * Consolidates the address results by grouping them by status type
   * and returns a map of consolidated results by group
   */
  const consolidatedResults = addressResults.reduce<ConsolidatedResults>(
    (acc, currentAddressResults, currentAddressResultIndex) => {
      for (const [group, groupResults] of Object.entries(currentAddressResults) as [StatusGroup, AnalysisResult[]][]) {
        if (!Array.isArray(groupResults)) continue
        const primaryGroupResult = getPrimaryResult(groupResults || [])

        if (primaryGroupResult) {
          acc[group] = {
            ...(acc[group] || {}),
            [primaryGroupResult.type]: [
              ...(acc[group]?.[primaryGroupResult.type] || []),
              { ...primaryGroupResult, addresses: [addresses[currentAddressResultIndex]] },
            ],
          }
        }
      }
      return acc
    },
    {},
  )

  for (const groupResults of Object.values(consolidatedResults)) {
    const currentGroupResults = [] as AnalysisResult[]

    for (const [type, typeResults] of Object.entries(groupResults)) {
      const numResults = typeResults.length
      if (numResults > 0) {
        const formatPluralDescription =
          MULTI_RESULT_DESCRIPTION[type as keyof typeof MULTI_RESULT_DESCRIPTION] || (() => typeResults[0].description)

        let addresses: (ContractDetails & { address: string })[]

        // For UNOFFICIAL_FALLBACK_HANDLER, use fallback handler addresses instead of contract addresses
        if (type === ContractStatus.UNOFFICIAL_FALLBACK_HANDLER) {
          addresses = typeResults
            .map((result) =>
              'fallbackHandler' in result ? (result.fallbackHandler as FallbackHandlerDetails | undefined) : undefined,
            )
            .filter((fh) => fh !== undefined)
            .map((fh) => ({
              address: fh.address,
              name: fh.name,
              logoUrl: fh.logoUrl,
            }))
        } else {
          addresses = typeResults
            .flatMap((result) => result.addresses)
            .filter((addresses) => addresses !== undefined)
            .map((addresses) => {
              const result = (addressesResultsMap as Record<string, { name?: string; logoUrl?: string }>)[addresses]
              return {
                address: addresses,
                name: result?.name,
                logoUrl: result?.logoUrl,
              }
            })
        }

        currentGroupResults.push({
          severity: typeResults[0].severity,
          title: typeResults[0].title,
          type: type as AnyStatus,
          description: formatPluralDescription(numResults, addressResults.length),
          addresses,
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
