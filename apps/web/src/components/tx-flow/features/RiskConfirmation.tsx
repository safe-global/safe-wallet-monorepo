import { useContext } from 'react'
import { SlotName, withSlot } from '../slots'
import { FEATURES } from '@/utils/featureToggled'
import { Card, Checkbox, FormControlLabel, Typography } from '@mui/material'
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
    <Card sx={{ px: 1, backgroundColor: 'background.main' }}>
      <Track {...MODALS_EVENTS.ACCEPT_RISK}>
        <FormControlLabel
          data-testid="risk-confirmation-checkbox"
          label={
            <Typography variant="body2" data-testid="risk-confirmation-text">
              I understand the risks and would like to proceed with this {isTransaction ? 'transaction' : 'message'}.
            </Typography>
          }
          control={<Checkbox checked={isRiskConfirmed} onChange={toggleConfirmation} color="primary" />}
        />
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
  feature: FEATURES.RISK_MITIGATION,
  useSlotCondition,
})

export default RiskConfirmationSlot
