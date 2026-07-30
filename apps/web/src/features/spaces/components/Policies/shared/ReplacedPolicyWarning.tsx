import type { ReactElement } from 'react'
import { Alert, Stack, Typography } from '@mui/material'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import type { ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { entryLabelOf, labelOf } from '../policyLabels'
import { isFallbackPolicyId } from '../policyAccess'
import { parseAccessId } from './accessSelector'

/**
 * The guard holds one policy per access, so configuring an occupied access replaces what
 * is there — on-chain, without a word. Shown on Review for any builder.
 */
export const ReplacedPolicyWarning = ({ policies }: { policies: ActivePolicy[] }): ReactElement | null => {
  if (policies.length === 0) return null

  return (
    <Alert severity="warning">
      <Stack gap={0.5}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>
          {policies.length === 1
            ? 'This replaces a policy already active on this Safe:'
            : `This replaces ${policies.length} policies already active on this Safe:`}
        </Typography>

        {policies.map((policy) => {
          const access = parseAccessId(policy.id)
          const scope = isFallbackPolicyId(policy.id)
            ? 'any transaction'
            : access
              ? `${shortenAddress(access.target)} · ${access.selector}`
              : shortenAddress(policy.id)

          return (
            <Typography key={policy.id} sx={{ fontSize: 13 }}>
              {labelOf(policy.type)} on {scope} ({entryLabelOf(policy)})
            </Typography>
          )
        })}
      </Stack>
    </Alert>
  )
}

export default ReplacedPolicyWarning
