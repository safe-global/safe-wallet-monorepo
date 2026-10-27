import { useId, type ReactElement } from 'react'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import SpendingLimitImpactRow, { type SpendingLimitImpactRowProps } from './SpendingLimitImpactRow'
import {
  getRestrictedSpendingLimitsTitle,
  getSpendingLimitsGroupTitle,
  RESTRICTED_SPENDING_LIMITS_DESCRIPTION,
  RESTRICTION_ACKNOWLEDGEMENT_LABEL,
} from './constants'

export type ExistingPoliciesContentProps = {
  safeName: string
  rows: (SpendingLimitImpactRowProps & { key: string })[]
  acknowledged: boolean
  onAcknowledgedChange: (acknowledged: boolean) => void
}

/** The Existing policies step's body: which spending limits the allowlist restricts, and the acknowledgement. */
const ExistingPoliciesContent = ({
  safeName,
  rows,
  acknowledged,
  onAcknowledgedChange,
}: ExistingPoliciesContentProps): ReactElement => {
  const acknowledgementId = useId()
  const restrictedCount = rows.filter(({ restriction }) => restriction).length

  return (
    <>
      <StatusAlert
        tone="warning"
        title={getRestrictedSpendingLimitsTitle(restrictedCount)}
        description={RESTRICTED_SPENDING_LIMITS_DESCRIPTION}
      />

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
        <Label htmlFor={acknowledgementId}>{RESTRICTION_ACKNOWLEDGEMENT_LABEL}</Label>
      </div>
    </>
  )
}

export default ExistingPoliciesContent
