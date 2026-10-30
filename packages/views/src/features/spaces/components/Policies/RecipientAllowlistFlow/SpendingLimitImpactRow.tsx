import type { ReactElement, ReactNode } from 'react'
import { Check, TriangleAlert } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Card } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { FOLLOWS_ALLOWLIST_LABEL, WILL_BE_BLOCKED_LABEL } from './constants'

export type SpendingLimitImpactRowProps = {
  /** The spender's identity, e.g. an avatar with its address book name. */
  spender: ReactNode
  /** e.g. `500/day · USDC is in this allowlist`. */
  description: string
  /** `restricted`: it can only go to the allowed recipients; `blocked`: its token is left out of the allowlist. */
  impact: 'restricted' | 'blocked'
}

/** One spending limit on the Existing policies step, and how the allowlist changes it. */
const SpendingLimitImpactRow = ({ spender, description, impact }: SpendingLimitImpactRowProps): ReactElement => (
  <Card variant="muted-nested" size="none" radius="lg" data-testid="spending-limit-impact">
    <div className="flex items-center gap-3 p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {spender}
        <Typography variant="paragraph-mini" color="muted">
          {description}
        </Typography>
      </div>
      {impact === 'blocked' ? (
        <Badge variant="warning" size="status" shape="status">
          <TriangleAlert className="size-3" aria-hidden />
          {WILL_BE_BLOCKED_LABEL}
        </Badge>
      ) : (
        <Badge variant="success" size="status" shape="status">
          <Check className="size-3" aria-hidden />
          {FOLLOWS_ALLOWLIST_LABEL}
        </Badge>
      )}
    </div>
  </Card>
)

export default SpendingLimitImpactRow
