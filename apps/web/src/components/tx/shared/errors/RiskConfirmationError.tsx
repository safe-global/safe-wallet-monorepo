import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { RiskConfirmationErrorView } from '@views/components/tx/shared/errors/RiskConfirmationErrorView'

const RiskConfirmationError = () => {
  const { needsRiskConfirmation, isRiskConfirmed } = useSafeShield()

  if (!needsRiskConfirmation || isRiskConfirmed) {
    return null
  }

  return <RiskConfirmationErrorView />
}

export default RiskConfirmationError
