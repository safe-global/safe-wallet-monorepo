import type { ReactElement } from 'react'
import { activePolicyKey, type ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import { Typography } from '@safe-global/views/components/ui/typography'
import { entryLabelOf, labelOf } from '../policyLabels'

/**
 * The guard holds one policy per access, so configuring an occupied access replaces what
 * is there — on-chain, without a word. Shown on Review for any builder.
 */
export const ReplacedPolicyWarning = ({ policies }: { policies: ActivePolicy[] }): ReactElement | null => {
  if (policies.length === 0) return null

  return (
    <Alert variant="warning">
      <AlertSeverityIcon variant="warning" />
      <AlertDescription>
        <div className="flex flex-col gap-1">
          <Typography variant="paragraph-small-bold">
            {policies.length === 1
              ? 'This replaces a policy already active on this Safe:'
              : `This replaces ${policies.length} policies already active on this Safe:`}
          </Typography>

          {policies.map((policy, index) => (
            // The access is no longer on the wire, so the entry's own scope is all there is
            // to name it by.
            <Typography key={activePolicyKey(policy, index)} variant="paragraph-small">
              {labelOf(policy.type)} ({entryLabelOf(policy)})
            </Typography>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}

export default ReplacedPolicyWarning
