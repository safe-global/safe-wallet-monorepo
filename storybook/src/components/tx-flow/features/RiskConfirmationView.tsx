import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Typography } from '@/components/ui/typography'
import Track from '@/components/common/Track'
import { MODALS_EVENTS } from '@/services/analytics/events/modals'

export type RiskConfirmationViewProps = {
  isTransaction: boolean
  isRiskConfirmed: boolean
  onToggleConfirmation: () => void
}

export const RiskConfirmationView = ({
  isTransaction,
  isRiskConfirmed,
  onToggleConfirmation,
}: RiskConfirmationViewProps) => {
  return (
    <Card size="none" surface="sunken">
      <Track {...MODALS_EVENTS.ACCEPT_RISK}>
        <Label
          htmlFor="risk-confirmation"
          data-testid="risk-confirmation-checkbox"
          className="cursor-pointer gap-3 px-2 py-2"
        >
          <Checkbox id="risk-confirmation" checked={isRiskConfirmed} onCheckedChange={onToggleConfirmation} />
          <Typography variant="paragraph-small" data-testid="risk-confirmation-text">
            I understand the risks and would like to proceed with this {isTransaction ? 'transaction' : 'message'}.
          </Typography>
        </Label>
      </Track>
    </Card>
  )
}
