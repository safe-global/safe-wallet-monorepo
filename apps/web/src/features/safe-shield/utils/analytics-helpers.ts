import type {
  RecipientAnalysisResults,
  ContractAnalysisResults,
  ThreatAnalysisResults,
  AnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { StatusGroup } from '@safe-global/utils/features/safe-shield/types'
import type { UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'
import { getSimulationStatus } from '@safe-global/utils/components/tx/security/tenderly/utils'

/**
 * Extracts titles from an array of analysis results
 */
const extractTitles = (results: Array<AnalysisResult>): string[] => {
  return results.map((result) => result.title)
}

/**
 * Extracts all result titles from address-based analysis results (recipient or contract)
 * Returns an array of all titles found across all addresses and status groups
 */
export const getAddressBasedResultTitles = (results?: RecipientAnalysisResults | ContractAnalysisResults): string[] => {
  if (!results) return []

  const titles: string[] = []

  for (const addressResults of Object.values(results)) {
    for (const groupResults of Object.values(addressResults)) {
      if (Array.isArray(groupResults)) {
        titles.push(...extractTitles(groupResults))
      }
    }
  }

  return titles
}

/**
 * Extracts all result titles from threat analysis results
 * Returns an array of all titles found in threat results
 */
export const getThreatResultTitles = (threatAnalysisResults?: ThreatAnalysisResults): string[] => {
  if (!threatAnalysisResults) return []

  const titles: string[] = []
  const commonResults = threatAnalysisResults[StatusGroup.COMMON]
  const threatResults = threatAnalysisResults[StatusGroup.THREAT]

  if (commonResults) titles.push(...extractTitles(commonResults))
  if (threatResults) titles.push(...extractTitles(threatResults))

  return titles
}

/**
 * Determines simulation result title based on simulation status
 * Returns "Success" or "Failed" based on the simulation completion status
 */
export const getSimulationResultTitle = (simulation: UseSimulationReturn): string | null => {
  const status = getSimulationStatus(simulation)
  if (!status.isFinished) return null
  return status.isError || !status.isSuccess ? 'Failed' : 'Success'
}
