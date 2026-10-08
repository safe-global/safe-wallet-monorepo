import { useMemo, type ReactElement } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
  DeadlockAnalysisResults,
  SafeAnalysisResult,
} from '@safe-global/utils/features/safe-shield/types'
import { SafeShieldHeader } from './SafeShieldHeader'
import { SafeShieldContent } from './SafeShieldContent'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { SafeTransaction } from '@safe-global/types-kit'
import { getOverallStatus } from '@safe-global/utils/features/safe-shield/utils'
import { useCheckSimulation } from '../hooks/useCheckSimulation'
import type { HypernativeAuthStatus } from '@/features/hypernative'
import { useCurrentChain } from '@/hooks/useChains'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { countChecks } from '../utils/countChecks'
import { isContractCall } from '@/features/safe-shield/utils/isContractCall'
import { SafeShieldDisplayView } from '@views/features/safe-shield/components/SafeShieldDisplayView'

export const SafeShieldDisplay = ({
  recipient,
  contract,
  threat,
  deadlock,
  safeTx,
  hypernativeAuth,
  showHypernativeInfo = true,
  showHypernativeActiveStatus = true,
  safeAnalysis,
  onAddToTrustedList,
  hasProFeatures = true,
  isSafePro = true,
  isOffchainMessage = false,
}: {
  recipient: AsyncResult<RecipientAnalysisResults>
  contract: AsyncResult<ContractAnalysisResults>
  threat: AsyncResult<ThreatAnalysisResults>
  deadlock: AsyncResult<DeadlockAnalysisResults>
  safeTx?: SafeTransaction
  hypernativeAuth?: HypernativeAuthStatus
  showHypernativeInfo?: boolean
  showHypernativeActiveStatus?: boolean
  safeAnalysis?: SafeAnalysisResult | null
  onAddToTrustedList?: () => void
  hasProFeatures?: boolean
  /** While SAFE_PRO is off the widget keeps its pre-Pro layout: no PRO block, simulation run by hand. */
  isSafePro?: boolean
  isOffchainMessage?: boolean
}): ReactElement => {
  const [recipientResults] = recipient || []
  const [contractResults] = contract || []
  const [threatResults] = threat || []
  const [deadlockResults] = deadlock || []
  const { hasSimulationError, isSimulationSuccess } = useCheckSimulation(safeTx)
  const isDarkMode = useDarkMode()
  const chain = useCurrentChain()
  const hasSimulation = Boolean(chain && hasFeature(chain, FEATURES.TX_SIMULATION))

  const hnLoginRequired = useMemo(
    () => hypernativeAuth !== undefined && (!hypernativeAuth.isAuthenticated || hypernativeAuth.isTokenExpired),
    [hypernativeAuth],
  )

  const overallStatus = useMemo(
    () =>
      getOverallStatus(
        recipientResults,
        contractResults,
        threatResults,
        hasSimulationError,
        hnLoginRequired,
        deadlockResults,
      ),
    [recipientResults, contractResults, threatResults, hasSimulationError, hnLoginRequired, deadlockResults],
  )

  const checks = useMemo(
    () =>
      countChecks({
        threat: threatResults,
        recipient: recipientResults,
        contract: contractResults,
        deadlock: deadlockResults,
        hasProFeatures,
        hasSimulation,
        isSimulationSuccess,
        isContractCall: isContractCall(safeTx),
        isOffchainMessage,
      }),
    [
      threatResults,
      recipientResults,
      contractResults,
      deadlockResults,
      hasProFeatures,
      hasSimulation,
      isSimulationSuccess,
      safeTx,
      isOffchainMessage,
    ],
  )

  return (
    <SafeShieldDisplayView
      isDarkMode={isDarkMode}
      header={
        <SafeShieldHeader
          recipient={recipient}
          contract={contract}
          threat={threat}
          deadlock={deadlock}
          overallStatus={overallStatus}
          checks={checks}
        />
      }
      content={
        <SafeShieldContent
          threat={threat}
          recipient={recipient}
          contract={contract}
          deadlock={deadlock}
          safeTx={safeTx}
          overallStatus={overallStatus}
          hypernativeAuth={hypernativeAuth}
          showHypernativeInfo={showHypernativeInfo}
          showHypernativeActiveStatus={showHypernativeActiveStatus}
          safeAnalysis={safeAnalysis}
          onAddToTrustedList={onAddToTrustedList}
          hasProFeatures={hasProFeatures}
          isSafePro={isSafePro}
          isOffchainMessage={isOffchainMessage}
        />
      }
    />
  )
}
