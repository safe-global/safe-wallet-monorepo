import type { ReactElement } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@/components/ui/alert'
import { describePolicy } from './copy'
import type { SpendingLimitSummaryModel } from './types'

/** What is being granted, in one sentence, and that spending within the limit needs no further approvals. */
const PolicyCallout = ({ policy }: { policy: SpendingLimitSummaryModel }): ReactElement => {
  const { title, description } = describePolicy(policy)

  return (
    <Alert variant="info" data-testid="spending-limit-summary-callout">
      <AlertSeverityIcon variant="info" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}

export default PolicyCallout
