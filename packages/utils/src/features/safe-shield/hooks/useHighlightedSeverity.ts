import { useMemo } from 'react'
import { ContractAnalysisResults, RecipientAnalysisResults, Severity, ThreatAnalysisResults } from '../types'
import { getPrimaryAnalysisResult } from '../utils/getPrimaryAnalysisResult'
import { normalizeThreatData, SEVERITY_PRIORITY } from '../utils'

export const useHighlightedSeverity = (
  recipientResults: RecipientAnalysisResults,
  contractResults: ContractAnalysisResults,
  threatResults: ThreatAnalysisResults,
  hasSimulationError?: boolean,
) => {
  const normalizedThreatData = useMemo(() => normalizeThreatData([threatResults, undefined, false]), [threatResults])

  const recipientPrimaryResult = useMemo(() => getPrimaryAnalysisResult(recipientResults), [recipientResults])
  const contractPrimaryResult = useMemo(() => getPrimaryAnalysisResult(contractResults), [contractResults])
  const threatPrimaryResult = useMemo(() => getPrimaryAnalysisResult(normalizedThreatData), [normalizedThreatData])

  const highlightedSeverity = useMemo(() => {
    const severities = [
      recipientPrimaryResult?.severity,
      contractPrimaryResult?.severity,
      threatPrimaryResult?.severity,
      hasSimulationError ? Severity.WARN : undefined,
    ].filter(Boolean) as Severity[]

    if (!severities.length) {
      return undefined
    }

    return severities.reduce<Severity | undefined>((current, severity) => {
      if (!current) {
        return severity
      }

      return SEVERITY_PRIORITY[severity] < SEVERITY_PRIORITY[current] ? severity : current
    }, undefined)
  }, [recipientPrimaryResult, contractPrimaryResult, hasSimulationError, threatPrimaryResult])

  return highlightedSeverity
}
