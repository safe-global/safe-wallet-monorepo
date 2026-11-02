import { type ReactElement } from 'react'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { useSafeShield } from './SafeShieldContext'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics/events/safe-shield'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { useHypernativeOAuth } from '@/features/hypernative/hooks/useHypernativeOAuth'
import { useIsHypernativeEligible } from '@/features/hypernative/hooks/useIsHypernativeEligible'

const SafeShieldWidget = (): ReactElement => {
  const {
    recipient,
    contract,
    threat,
    deadlock,
    safeTx,
    safeAnalysis,
    addToTrustedList,
    hasProFeatures,
    isSafePro,
    isOffchainMessage,
  } = useSafeShield()
  const hypernativeAuth = useHypernativeOAuth()
  const { isHypernativeEligible, isHypernativeGuard, loading: eligibilityLoading } = useIsHypernativeEligible()
  const showHnInfo = !eligibilityLoading && isHypernativeEligible
  const showHnActiveStatus = !eligibilityLoading && isHypernativeGuard

  useTrackOnce(SAFE_SHIELD_EVENTS.TRANSACTION_STARTED)

  return (
    <SafeShieldDisplay
      data-testid="safe-shield-widget"
      recipient={recipient}
      contract={contract}
      threat={threat}
      deadlock={deadlock}
      safeTx={safeTx}
      hypernativeAuth={!eligibilityLoading && isHypernativeEligible ? hypernativeAuth : undefined}
      showHypernativeInfo={showHnInfo}
      showHypernativeActiveStatus={showHnActiveStatus}
      safeAnalysis={safeAnalysis}
      onAddToTrustedList={addToTrustedList}
      hasProFeatures={hasProFeatures}
      isSafePro={isSafePro}
      isOffchainMessage={isOffchainMessage}
    />
  )
}

export default SafeShieldWidget

// Analysis card components (used by hypernative)
export { AnalysisGroupCard, type AnalysisGroupCardProps } from './components/AnalysisGroupCard'
