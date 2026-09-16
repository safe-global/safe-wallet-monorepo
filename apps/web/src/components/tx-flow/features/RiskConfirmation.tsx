import { useContext } from 'react'
import { SlotName, withSlot } from '../slots'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'
import { SafeTxContext } from '../SafeTxProvider'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'

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
    <Card size="none" surface="sunken">
      <Track {...MODALS_EVENTS.ACCEPT_RISK}>
        <Label
          htmlFor="risk-confirmation"
          data-testid="risk-confirmation-checkbox"
          className="cursor-pointer gap-3 px-2 py-2"
        >
          <Checkbox id="risk-confirmation" checked={isRiskConfirmed} onCheckedChange={toggleConfirmation} />
          <Typography variant="paragraph-small" data-testid="risk-confirmation-text">
            I understand the risks and would like to proceed with this {isTransaction ? 'transaction' : 'message'}.
          </Typography>
        </Label>
      </Track>
    </Card>
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
