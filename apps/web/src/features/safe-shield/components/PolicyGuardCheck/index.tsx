import type { ReactElement } from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import type { GuardCheckTransaction } from '@safe-global/utils/services/policy-guard'
import { Alert, AlertDescription, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Typography } from '@safe-global/views/components/ui/typography'
import { useGuardPolicyChecks } from '../../hooks/useGuardPolicyCheck'
import { describeGuardCheck, PERMITTED } from '../../utils/policyGuardMessages'

/**
 * What this Safe's policy guard would do with the transaction being composed.
 *
 * Renders nothing unless the Safe runs a recognised policy guard: another guard's behaviour is
 * unknown, and a verdict that cannot be read is reported as nothing rather than as a refusal.
 */
const PolicyGuardCheck = ({ calls }: { calls: GuardCheckTransaction[] | undefined }): ReactElement | null => {
  const { blocked, isAllowed, isLoading } = useGuardPolicyChecks(calls)

  if (isLoading) return null

  const message = blocked ? describeGuardCheck(blocked.result, blocked.action) : isAllowed ? PERMITTED : undefined
  if (!message) return null

  return (
    <Alert variant={blocked ? 'warning' : 'success'} data-testid="policy-guard-check">
      {blocked ? <ShieldAlert className="size-4" aria-hidden /> : <ShieldCheck className="size-4" aria-hidden />}
      <AlertTitle>{message.title}</AlertTitle>
      <AlertDescription>
        <span className="block">{message.description}</span>

        {message.fix && (
          <Typography variant="paragraph-mini" className="mt-2 block" data-testid="policy-guard-fix">
            {message.fix}
          </Typography>
        )}
      </AlertDescription>
    </Alert>
  )
}

export default PolicyGuardCheck
