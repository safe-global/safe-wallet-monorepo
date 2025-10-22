import { type ReactElement } from 'react'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { useSafeShield } from './SafeShieldContext'

const SafeShieldWidget = (): ReactElement => {
  const { recipient, contract } = useSafeShield()

  return <SafeShieldDisplay data-testid="safe-shield-widget" recipient={recipient} contract={contract} />
}

export default SafeShieldWidget
