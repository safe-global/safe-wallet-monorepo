import type { ReactElement } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon, AlertTitle } from '@safe-global/views/components/ui/alert'
import {
  TIME_LOCKED_TEXT,
  TIME_LOCKED_TITLE,
  UNKNOWN_GUARD_WARNING_TEXT,
  UNKNOWN_GUARD_WARNING_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'

type GuardStateAlertsProps = {
  /** The policy guard is already installed, so the change is requested and applied after the delay. */
  isGuardSet: boolean
  /** A different guard is installed and the batch replaces it. */
  isUnknownGuard: boolean
}

/** How the Safe's current guard changes what confirming does. Every guard policy shows the same two states. */
const GuardStateAlerts = ({ isGuardSet, isUnknownGuard }: GuardStateAlertsProps): ReactElement | null => {
  if (isUnknownGuard) {
    return (
      <Alert variant="warning" data-testid="guard-policy-unknown-guard">
        <AlertSeverityIcon variant="warning" />
        <AlertTitle>{UNKNOWN_GUARD_WARNING_TITLE}</AlertTitle>
        <AlertDescription>{UNKNOWN_GUARD_WARNING_TEXT}</AlertDescription>
      </Alert>
    )
  }

  if (isGuardSet) {
    return (
      <Alert variant="info" data-testid="guard-policy-time-locked">
        <AlertSeverityIcon variant="info" />
        <AlertTitle>{TIME_LOCKED_TITLE}</AlertTitle>
        <AlertDescription>{TIME_LOCKED_TEXT}</AlertDescription>
      </Alert>
    )
  }

  return null
}

export default GuardStateAlerts
