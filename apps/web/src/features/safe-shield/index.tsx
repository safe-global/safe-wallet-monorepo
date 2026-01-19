import { useEffect, type ReactElement } from 'react'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { useSafeShield } from './SafeShieldContext'
import { SAFE_SHIELD_EVENTS, trackEvent } from '@/services/analytics'
import { useHypernativeOAuth } from '@/features/hypernative/hooks/useHypernativeOAuth'
import { useIsHypernativeGuard } from '@/features/hypernative/hooks/useIsHypernativeGuard'

const SafeShieldWidget = (): ReactElement => {
  const { recipient, contract, threat, safeTx } = useSafeShield()
  const hypernativeAuth = useHypernativeOAuth()
  const { isHypernativeGuard, loading: HNGuardCheckLoading } = useIsHypernativeGuard()

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
      hypernativeAuth={!HNGuardCheckLoading && isHypernativeGuard ? hypernativeAuth : undefined}
    />
  )
}

export default SafeShieldWidget
