import type { ReactElement, ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'
import { NOT_AFFECTED_LABEL, WILL_BE_RESTRICTED_LABEL } from './constants'

export type SpendingLimitImpactRowProps = {
  /** The spender's identity, e.g. an avatar with its address book name. */
  spender: ReactNode
  /** e.g. `500/day · USDC is in this allowlist`. */
  description: string
  /** The allowlist covers this spending limit's token, so the spender can only send it to the allowed recipients. */
  restricted: boolean
}

/** One spending limit on the Existing policies step, and how the allowlist changes it. */
const SpendingLimitImpactRow = ({ spender, description, restricted }: SpendingLimitImpactRowProps): ReactElement => (
  <div className="flex items-center gap-3 rounded-lg bg-card p-3" data-testid="spending-limit-impact">
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      {spender}
      <Typography variant="paragraph-mini" color="muted">
        {description}
      </Typography>
    </div>
    {restricted ? (
      <Badge variant="warning" size="status" shape="status">
        <TriangleAlert className="size-3" aria-hidden />
        {WILL_BE_RESTRICTED_LABEL}
      </Badge>
    ) : (
      <Badge variant="subtle" size="status" shape="status">
        {NOT_AFFECTED_LABEL}
      </Badge>
    )}
  </div>
)

export default SpendingLimitImpactRow
