import type { ReactElement } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'

type GuardPolicyCalloutProps = {
  title: string
  description: string
}

/** The policy in plain language, at the top of the summary, as `PolicyCallout` is for a spending limit. */
const GuardPolicyCallout = ({ title, description }: GuardPolicyCalloutProps): ReactElement => (
  <Alert variant="info" data-testid="guard-policy-summary-callout">
    <AlertSeverityIcon variant="info" />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{description}</AlertDescription>
  </Alert>
)

export default GuardPolicyCallout
