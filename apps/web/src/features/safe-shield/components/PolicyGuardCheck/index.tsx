import type { ReactElement } from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { Alert, AlertDescription, AlertTitle } from '@safe-global/views/components/ui/alert'
import { Typography } from '@safe-global/views/components/ui/typography'
import { useGuardPolicyCheck } from '../../hooks/useGuardPolicyCheck'
import { describeGuardCheck } from '../../utils/policyGuardMessages'

/**
 * What this Safe's policy guard would do with the transaction being reviewed.
 *
 * Renders nothing unless the Safe runs a recognised policy guard: another guard's behaviour is
 * unknown, and a check that cannot be read is reported as nothing rather than as a verdict.
 */
const PolicyGuardCheck = ({ safeTx }: { safeTx: SafeTransaction | undefined }): ReactElement | null => {
  const { result, action, isLoading } = useGuardPolicyCheck(safeTx)

  if (isLoading || !result) return null

  const message = describeGuardCheck(result, action)
  if (!message) return null

  const isBlocked = result.status !== 'allowed'

  return (
    <Alert variant={isBlocked ? 'warning' : 'success'} data-testid="policy-guard-check">
      {isBlocked ? <ShieldAlert className="size-4" aria-hidden /> : <ShieldCheck className="size-4" aria-hidden />}
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
