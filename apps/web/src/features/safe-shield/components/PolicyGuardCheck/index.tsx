import type { ReactElement } from 'react'
import type { GuardCheckResult } from '@safe-global/utils/services/policy-guard'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import type { GuardPolicyCheck } from '../../hooks/useGuardPolicyChecks'

const REFUSED = "This account's policies will refuse this transaction."

const UNSUPPORTED_MESSAGES: Record<string, string> = {
  NonZeroGasPrice: "This transaction includes a gas refund, which this account's policies don't allow.",
  NonZeroSafeTxGas:
    "This transaction sets a Safe gas limit, which this account's policies don't allow. Set it to 0 under advanced parameters.",
  GuardTargetDenied: 'Policy settings can only be requested, applied or cancelled, with no funds attached.',
  ModuleConfigurationDenied: "Policies can't be changed through a module. Use a regular Safe transaction.",
}

const refusalMessage = (blocked: GuardCheckResult): string =>
  (blocked.status === 'unsupported' && UNSUPPORTED_MESSAGES[blocked.reason]) || REFUSED

/** Renders nothing until the policy guard has given a verdict on the current transaction. */
const PolicyGuardCheck = ({ blocked, isAllowed }: GuardPolicyCheck): ReactElement | null => {
  if (!blocked && !isAllowed) return null

  const variant = blocked ? 'destructive' : 'success'

  return (
    <Alert variant={variant} data-testid="policy-guard-check">
      <AlertSeverityIcon variant={variant} />
      <AlertDescription>{blocked ? refusalMessage(blocked) : 'Policy checks passed'}</AlertDescription>
    </Alert>
  )
}

export default PolicyGuardCheck
