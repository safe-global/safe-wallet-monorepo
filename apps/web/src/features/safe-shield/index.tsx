import { type ReactElement } from 'react'
import { SafeShieldDisplay } from './components/SafeShieldDisplay'
import { useSafeShield } from './SafeShieldContext'

const SafeShieldWidget = (): ReactElement => {
  const { recipient, contract, safeTx } = useSafeShield()

  return (
    <SafeShieldDisplay data-testid="safe-shield-widget" recipient={recipient} contract={contract} safeTx={safeTx} />
  )
}

export default SafeShieldWidget
