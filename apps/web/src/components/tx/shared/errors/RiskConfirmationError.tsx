import ErrorMessage from '@/components/tx/ErrorMessage'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'

const RiskConfirmationError = () => {
  const { needsRiskConfirmation, isRiskConfirmed } = useSafeShield()

  if (!needsRiskConfirmation || isRiskConfirmed) {
    return null
  }

  return <ErrorMessage level="warning">Please acknowledge the risk before proceeding.</ErrorMessage>
}

export default RiskConfirmationError
