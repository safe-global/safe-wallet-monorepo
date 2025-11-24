import { useEffect, type ReactElement } from 'react'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { useSafeShield } from './SafeShieldContext'
import { SAFE_SHIELD_EVENTS, trackEvent } from '@/services/analytics'

const SafeShieldWidget = (): ReactElement => {
  const { recipient, contract, threat, safeTx } = useSafeShield()

  // Track when a transaction flow is started
  useEffect(() => {
    trackEvent(SAFE_SHIELD_EVENTS.TRANSACTION_STARTED)
  }, [])

  return <SafeShieldDisplay recipient={recipient} contract={contract} threat={threat} safeTx={safeTx} />
}

export default SafeShieldWidget
