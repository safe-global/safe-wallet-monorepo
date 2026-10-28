import { useId, type ReactElement, type ReactNode } from 'react'
import StatusAlert, { type StatusAlertTone } from '@safe-global/views/components/common/StatusAlert'
import { Card } from '@safe-global/views/components/ui/card'
import { Checkbox } from '@safe-global/views/components/ui/checkbox'
import { Label } from '@safe-global/views/components/ui/label'
import { Typography } from '@safe-global/views/components/ui/typography'
import SpendingLimitImpactRow, { type SpendingLimitImpactRowProps } from './SpendingLimitImpactRow'
import { getSpendingLimitsGroupTitle, SPENDING_LIMITS_ACKNOWLEDGEMENT_LABEL } from './constants'

export type ExistingPoliciesContentProps = {
  safeName: string
  /** What the allowlist does to the spending limits (a warning when it blocks any of them), or why they couldn't be loaded. */
  banner: {
    title: string
    description?: string
    tone: Extract<StatusAlertTone, 'warning' | 'info' | 'error' | 'loading'>
    action?: ReactNode
  }
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

      {rows.length > 0 && (
        <Card variant="muted" size="none" radius="xl">
          <div className="flex flex-col gap-3 p-4">
            <Typography variant="paragraph-small-medium">{getSpendingLimitsGroupTitle(safeName)}</Typography>
            {rows.map(({ key, ...row }) => (
              <SpendingLimitImpactRow key={key} {...row} />
            ))}
          </div>
        </Card>
      )}

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
