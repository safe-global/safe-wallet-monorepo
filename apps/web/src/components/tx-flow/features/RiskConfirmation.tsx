import { useContext } from 'react'
import { SlotName, withSlot } from '../slots'
import { Card } from '@safe-global/views/components/ui/card'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics'
import { SafeTxContext } from '../SafeTxProvider'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'

type RiskConfirmationProps = {
  subject: 'transaction' | 'message'
}

export const RiskConfirmation = ({ subject }: RiskConfirmationProps) => {
  const { needsRiskConfirmation, isRiskConfirmed, setIsRiskConfirmed } = useSafeShield()

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
            I understand the risks and would like to proceed with this {subject}.
          </Typography>
        </Label>
      </Track>
    </Card>
  )
}

const TxFlowRiskConfirmation = () => {
  const { safeTx } = useContext(SafeTxContext)
  // A flow without a safeTx scans a message
  return <RiskConfirmation subject={safeTx ? 'transaction' : 'message'} />
}

const useSlotCondition = () => {
  const { needsRiskConfirmation } = useSafeShield()
  return needsRiskConfirmation
}

const RiskConfirmationSlot = withSlot({
  Component: TxFlowRiskConfirmation,
  slotName: SlotName.Footer,
  id: 'riskConfirmation',
  useSlotCondition,
})

export default RiskConfirmationSlot
