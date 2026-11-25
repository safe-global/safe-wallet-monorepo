import type { ReactElement } from 'react'
import type { GuardCheckResult } from '@safe-global/utils/services/policy-guard'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { Typography } from '@safe-global/views/components/ui/typography'
import type { GuardPolicyCheck } from '../../hooks/useGuardPolicyChecks'
import { SeverityIcon } from '../../public/components/SeverityIcon'

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

type PolicyGuardCheckProps = GuardPolicyCheck & {
  /** The overall severity of the analysis: a pass is muted, like the other checks, unless it is the overall one */
  highlightedSeverity?: Severity
}

/** One Safe Shield check row; renders nothing until the policy guard has given a verdict on the current transaction. */
const PolicyGuardCheck = ({ blocked, isAllowed, highlightedSeverity }: PolicyGuardCheckProps): ReactElement | null => {
  if (!blocked && !isAllowed) return null

  const severity = blocked ? Severity.CRITICAL : Severity.OK
  const isMuted = !blocked && !!highlightedSeverity && highlightedSeverity !== severity

  return (
    <div className="flex flex-row items-start gap-2 p-3" data-testid="policy-guard-check">
      <span className="mt-0.5 flex shrink-0">
        <SeverityIcon severity={severity} muted={isMuted} />
      </span>
      <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
        {blocked ? refusalMessage(blocked) : 'Policy checks passed'}
      </Typography>
    </div>
  )
}

export default PolicyGuardCheck
