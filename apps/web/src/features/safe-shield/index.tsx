import { useEffect, useMemo, type ReactElement } from 'react'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { useSafeShield } from './SafeShieldContext'
import { SAFE_SHIELD_EVENTS, trackEvent } from '@/services/analytics'
import { useHypernativeOAuth } from '@/features/hypernative/hooks/useHypernativeOAuth'
import { useIsHypernativeGuard } from '@/features/hypernative/hooks/useIsHypernativeGuard'

const SafeShieldWidget = (): ReactElement => {
  const { recipient, contract, threat, safeTx } = useSafeShield()
  const { isAuthenticated, isTokenExpired, loading: authLoading } = useHypernativeOAuth()
  const { isHypernativeGuard, loading: HNGuardCheckLoading } = useIsHypernativeGuard()

  const hnLoginRequired = useMemo(
    () => (!isAuthenticated || isTokenExpired) && !authLoading && !HNGuardCheckLoading && isHypernativeGuard,
    [isAuthenticated, isTokenExpired, authLoading, HNGuardCheckLoading, isHypernativeGuard],
  )

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
      hnLoginRequired={hnLoginRequired}
    />
  )
}

export default SafeShieldWidget
