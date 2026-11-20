import { type ReactElement } from 'react'
import { SafeShieldDisplay } from './SafeShieldDisplay'
import { useSafeShield } from '../public/hooks/useSafeShield'
import { SAFE_SHIELD_EVENTS } from '@/services/analytics/events/safe-shield'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { useHypernativeOAuth } from '@/features/hypernative/public/hooks/useHypernativeOAuth'
import { useIsHypernativeEligible } from '@/features/hypernative/public/hooks/useIsHypernativeEligible'
// eslint-disable-next-line no-restricted-imports -- prototype: opens Try Safe Pro in Storybook
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
