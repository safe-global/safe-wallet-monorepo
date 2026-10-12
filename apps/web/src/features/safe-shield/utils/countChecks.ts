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

/** Locked recipient, contract and simulation rows count as checks too, so a Workspace without Safe Pro reads as "1 of 3" ("1 of 4" on a contract call). */
export const countChecks = ({
  threat,
  recipient,
  contract,
  deadlock,
  hasProFeatures,
  hasSimulation,
  isSimulationSuccess,
  isContractCall = false,
  isOffchainMessage = false,
}: {
  threat?: ThreatAnalysisResults
  recipient?: RecipientAnalysisResults
  contract?: ContractAnalysisResults
  deadlock?: DeadlockAnalysisResults
  hasProFeatures: boolean
  /** The chain offers a simulation, so the row is on screen (running or locked). */
  hasSimulation: boolean
  isSimulationSuccess: boolean
  /** The transaction calls a contract, so the contract row is on screen (with results or locked). */
  isContractCall?: boolean
  isOffchainMessage?: boolean
}): ChecksCount => {
  const isOk = (status: { severity: Severity } | undefined) => status?.severity === Severity.OK
  const checks: Array<{ shown: boolean; passed: boolean }> = [
    { shown: !isEmpty(threat?.THREAT), passed: isOk(getOverallStatus(undefined, undefined, threat)) },
    {
      shown: !isEmpty(contract) || (!hasProFeatures && isContractCall),
      passed: !isEmpty(contract) && isOk(getOverallStatus(undefined, contract)),
    },
    {
      shown: !isEmpty(deadlock),
      passed: isOk(getOverallStatus(undefined, undefined, undefined, false, false, deadlock)),
    },
    {
      shown: (!hasProFeatures && !isOffchainMessage) || !isEmpty(recipient),
      passed: hasProFeatures && !isEmpty(recipient) && isOk(getOverallStatus(recipient)),
    },
    { shown: hasSimulation && !isOffchainMessage, passed: hasSimulation && isSimulationSuccess },
  ]
  const shown = checks.filter((check) => check.shown)
  return { total: shown.length, passed: shown.filter((check) => check.passed).length }
}
