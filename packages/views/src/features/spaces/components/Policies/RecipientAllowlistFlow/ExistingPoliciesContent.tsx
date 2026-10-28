import { useId, type ReactElement } from 'react'
import StatusAlert, { type StatusAlertTone } from '@safe-global/views/components/common/StatusAlert'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import SpendingLimitImpactRow, { type SpendingLimitImpactRowProps } from './SpendingLimitImpactRow'
import { getSpendingLimitsGroupTitle, SPENDING_LIMITS_ACKNOWLEDGEMENT_LABEL } from './constants'

export type ExistingPoliciesContentProps = {
  safeName: string
  /** How many of the spending limits will follow the allowlist's rules. */
  banner: { title: string; description: string; tone: Extract<StatusAlertTone, 'info'> }
  rows: (SpendingLimitImpactRowProps & { key: string })[]
  acknowledged: boolean
  onAcknowledgedChange: (acknowledged: boolean) => void
}

/** The Existing policies step's body: every spending limit, those the allowlist restricts first, and the acknowledgement. */
const ExistingPoliciesContent = ({
  safeName,
  banner,
  rows,
  acknowledged,
  onAcknowledgedChange,
}: ExistingPoliciesContentProps): ReactElement => {
  const acknowledgementId = useId()

  return (
    <>
      <StatusAlert {...banner} />

      <div className="flex flex-col gap-3 rounded-xl bg-muted p-4">
        <Typography variant="paragraph-small-medium">{getSpendingLimitsGroupTitle(safeName)}</Typography>
        {rows.map(({ key, ...row }) => (
          <SpendingLimitImpactRow key={key} {...row} />
        ))}
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id={acknowledgementId}
          checked={acknowledged}
          onCheckedChange={(checked) => onAcknowledgedChange(checked === true)}
        />
        <Label htmlFor={acknowledgementId}>{SPENDING_LIMITS_ACKNOWLEDGEMENT_LABEL}</Label>
      </div>
    </>
  )
}

export default ExistingPoliciesContent
