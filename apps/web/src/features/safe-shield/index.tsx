import { type ReactElement } from 'react'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { useSafeShield } from './SafeShieldContext'

const SafeShieldWidget = (): ReactElement => {
  const { recipientAnalysis } = useSafeShield()

  return <SafeShieldDisplay data-testid="safe-shield-widget" recipient={recipientAnalysis} />
}

export default SafeShieldWidget
