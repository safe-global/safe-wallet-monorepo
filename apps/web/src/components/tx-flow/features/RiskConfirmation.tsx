import { useContext } from 'react'
import { SlotName, withSlot } from '../slots'
import { SafeTxContext } from '../SafeTxProvider'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { RiskConfirmationView } from '@views/components/tx-flow/features/RiskConfirmationView'

export const RiskConfirmation = () => {
  const { needsRiskConfirmation, isRiskConfirmed, setIsRiskConfirmed } = useSafeShield()
  const { safeTx } = useContext(SafeTxContext)

  // We either scan a tx or a message if tx is undefined
  const isTransaction = !!safeTx

  const toggleConfirmation = () => {
    setIsRiskConfirmed((prev) => !prev)
  }

  if (!needsRiskConfirmation) {
    return null
  }

  return (
    <RiskConfirmationView
      isTransaction={isTransaction}
      isRiskConfirmed={isRiskConfirmed}
      onToggleConfirmation={toggleConfirmation}
    />
  )
}

const useSlotCondition = () => {
  const { needsRiskConfirmation } = useSafeShield()
  return needsRiskConfirmation
}

const RiskConfirmationSlot = withSlot({
  Component: RiskConfirmation,
  slotName: SlotName.Footer,
  id: 'riskConfirmation',
  useSlotCondition,
})

export default RiskConfirmationSlot
