import isEmpty from 'lodash/isEmpty'
import type {
  ContractAnalysisResults,
  DeadlockAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'

export type ChecksCount = { passed: number; total: number }

/** Locked recipient and simulation rows count as checks too, so a Workspace without Safe Pro reads as "1 of 3". */
export const countChecks = ({
  threat,
  recipient,
  contract,
  deadlock,
  hasProFeatures,
  hasSimulation,
  isSimulationSuccess,
}: {
  threat?: ThreatAnalysisResults
  recipient?: RecipientAnalysisResults
  contract?: ContractAnalysisResults
  deadlock?: DeadlockAnalysisResults
  hasProFeatures: boolean
  /** The chain offers a simulation, so the row is on screen (running or locked). */
  hasSimulation: boolean
  isSimulationSuccess: boolean
}): ChecksCount => {
  const isOk = (status: { severity: Severity } | undefined) => status?.severity === Severity.OK
  const checks: Array<{ shown: boolean; passed: boolean }> = [
    { shown: !isEmpty(threat?.THREAT), passed: isOk(getOverallStatus(undefined, undefined, threat)) },
    { shown: !isEmpty(contract), passed: isOk(getOverallStatus(undefined, contract)) },
    {
      shown: !isEmpty(deadlock),
      passed: isOk(getOverallStatus(undefined, undefined, undefined, false, false, deadlock)),
    },
    {
      shown: !hasProFeatures || !isEmpty(recipient),
      passed: hasProFeatures && !isEmpty(recipient) && isOk(getOverallStatus(recipient)),
    },
    { shown: hasSimulation, passed: hasSimulation && isSimulationSuccess },
  ]
  const shown = checks.filter((check) => check.shown)
  return { total: shown.length, passed: shown.filter((check) => check.passed).length }
}
