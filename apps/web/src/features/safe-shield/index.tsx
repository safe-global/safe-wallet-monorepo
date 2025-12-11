import { useEffect, type ReactElement } from 'react'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { useSafeShield } from './SafeShieldContext'
import { SAFE_SHIELD_EVENTS, trackEvent } from '@/services/analytics'

const SafeShieldWidget = (): ReactElement => {
  const { recipient, contract, threat, nestedThreat, isNested, safeTx } = useSafeShield()

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
      nestedThreat={nestedThreat}
      isNested={isNested}
      safeTx={safeTx}
    />
  )
}

export default SafeShieldWidget
