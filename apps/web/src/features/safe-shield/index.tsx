import { type ReactElement } from 'react'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { useSafeShield } from './SafeShieldContext'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { useHypernativeOAuth, useIsHypernativeEligible } from '@/features/hypernative'
import { TRY_PRO_REASONS, useTryPro } from '@/features/safe-pro-announcement/prototypes/tryPro'

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
  const openTryPro = useTryPro()

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
      onUnlockPro={openTryPro && ((check) => openTryPro(TRY_PRO_REASONS[check]))}
    />
  )
}

export default SafeShieldWidget

// Recipient analysis hook (used by tx-flow)
export { useRecipientAnalysis } from './hooks/useRecipientAnalysis'

// Analysis card components (used by hypernative)
export { AnalysisGroupCard, type AnalysisGroupCardProps } from './components/AnalysisGroupCard'
export { AnalysisGroupCardDisabled } from '@safe-global/views/features/safe-shield/components/ThreatAnalysis/AnalysisGroupCardDisabled'
