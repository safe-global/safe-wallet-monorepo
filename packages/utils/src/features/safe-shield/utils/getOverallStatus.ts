import type {
  ContractAnalysisResults,
  ThreatAnalysisResults,
  RecipientAnalysisResults,
  DeadlockCheckResult,
} from '../types'
import { CommonSharedStatus, DeadlockReason, DeadlockStatus, Severity, ThreatStatus } from '../types'
import type { AnalysisResult } from '../types'
import { getPrimaryResult } from './analysisUtils'
import { SEVERITY_TO_TITLE } from '../constants'
import { isThreatAnalysisResult } from './mapVisibleAnalysisResults'

function aggregateAnalysisResults(
  recipientResults?: RecipientAnalysisResults,
  contractResults?: ContractAnalysisResults,
  threatResults?: ThreatAnalysisResults,
  hasSimulationError?: boolean,
  hnLoginRequired?: boolean,
  deadlockResult?: DeadlockCheckResult,
): AnalysisResult[] {
  const allResults: AnalysisResult[] = []

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

  if (deadlockResult?.status === DeadlockStatus.BLOCKED) {
    allResults.push({
      severity: Severity.CRITICAL,
      title: SEVERITY_TO_TITLE[Severity.CRITICAL],
      type: CommonSharedStatus.FAILED,
      description: deadlockResult.reason || DeadlockReason.GENERIC,
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

  return allResults
}

export const getOverallStatus = (
  recipientResults?: RecipientAnalysisResults,
  contractResults?: ContractAnalysisResults,
  threatResults?: ThreatAnalysisResults,
  hasSimulationError?: boolean,
  hnLoginRequired?: boolean,
  deadlockResult?: DeadlockCheckResult,
): { severity: Severity; title: string } | undefined => {
  if (
    !recipientResults &&
    !contractResults &&
    !threatResults &&
    !hasSimulationError &&
    !hnLoginRequired &&
    deadlockResult?.status !== DeadlockStatus.BLOCKED
  ) {
    return undefined
  }

  const allResults = aggregateAnalysisResults(
    recipientResults,
    contractResults,
    threatResults,
    hasSimulationError,
    hnLoginRequired,
    deadlockResult,
  )

  const primaryResult = getPrimaryResult(allResults)

  if (primaryResult) {
    return {
      severity: primaryResult.severity,
      title: primaryResult.title || SEVERITY_TO_TITLE[primaryResult.severity as Severity],
    }
  }
}
