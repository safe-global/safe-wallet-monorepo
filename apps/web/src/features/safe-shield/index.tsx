import { useEffect, type ReactElement } from 'react'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { useSafeShield } from './SafeShieldContext'
import { SAFE_SHIELD_EVENTS, trackEvent } from '@/services/analytics'
import { useLoadFeature } from '@/features/__core__'
import { HypernativeFeature } from '@/features/hypernative'

const SafeShieldWidget = (): ReactElement => {
  const { recipient, contract, threat, safeTx } = useSafeShield()
  const hypernative = useLoadFeature(HypernativeFeature)
  const hypernativeAuth = hypernative?.hooks.useHypernativeOAuth()
  const eligibility = hypernative?.hooks.useIsHypernativeEligible()
  const isHypernativeEligible = eligibility?.isHypernativeEligible ?? false
  const isHypernativeGuard = eligibility?.isHypernativeGuard ?? false
  const eligibilityLoading = eligibility?.loading ?? true
  const showHnInfo = !eligibilityLoading && isHypernativeEligible
  const showHnActiveStatus = !eligibilityLoading && isHypernativeGuard

  // Track when a transaction flow is started
  useEffect(() => {
    trackEvent(SAFE_SHIELD_EVENTS.TRANSACTION_STARTED)
  }, [])

  return (
    <SafeShieldDisplay
      data-testid="safe-shield-widget"
      recipient={recipient}
      contract={contract}
      threat={threat}
      safeTx={safeTx}
      hypernativeAuth={!eligibilityLoading && isHypernativeEligible ? hypernativeAuth : undefined}
      showHypernativeInfo={showHnInfo}
      showHypernativeActiveStatus={showHnActiveStatus}
    />
  )
}

export default SafeShieldWidget
