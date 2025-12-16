import { useHighlightedSeverity } from '@safe-global/utils/features/safe-shield/hooks/useHighlightedSeverity'
import { normalizeThreatData } from '@safe-global/utils/features/safe-shield/utils'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type {
  ContractAnalysisResults,
  RecipientAnalysisResults,
  ThreatAnalysisResults,
} from '@safe-global/utils/features/safe-shield/types'

interface UseSafeShieldSeverityProps {
  recipient?: AsyncResult<RecipientAnalysisResults>
  contract?: AsyncResult<ContractAnalysisResults>
  threat?: AsyncResult<ThreatAnalysisResults>
  hasSimulationError?: boolean
}

export const useSafeShieldSeverity = ({
  recipient,
  contract,
  threat,
  hasSimulationError,
}: UseSafeShieldSeverityProps) => {
  // Extract data from AsyncResults
  const [recipientData = {}] = recipient || []
  const [contractData = {}] = contract || []
  const normalizedThreatData = normalizeThreatData(threat)

  // Get highlighted severity
  const highlightedSeverity = useHighlightedSeverity(
    recipientData,
    contractData,
    normalizedThreatData,
    hasSimulationError,
  )

  return highlightedSeverity
}
