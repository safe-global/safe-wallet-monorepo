import type { ReactElement, ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Badge } from '@safe-global/views/components/ui/badge'
import { Typography } from '@safe-global/views/components/ui/typography'
import { IMPACT_AFTER_LABEL, IMPACT_TODAY_LABEL, NOT_AFFECTED_LABEL, WILL_BE_RESTRICTED_LABEL } from './constants'

export type SpendingLimitImpactRowProps = {
  /** The spender's identity, e.g. an avatar with its address book name. */
  spender: ReactNode
  /** e.g. `500/day · USDC is in this allowlist`. */
  description: string
  /** Set when the allowlist restricts this spending limit: what it can do today and after. */
  restriction?: { today: string; after: string }
}

/** One spending limit on the Existing policies step, and how the allowlist changes it. */
const SpendingLimitImpactRow = ({ spender, description, restriction }: SpendingLimitImpactRowProps): ReactElement => (
  <div className="flex flex-col gap-2" data-testid="spending-limit-impact">
    <div className="flex items-center gap-3 rounded-lg bg-card p-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {spender}
        <Typography variant="paragraph-mini" color="muted">
          {description}
        </Typography>
      </div>
      {restriction ? (
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
    {restriction && (
      <dl className="ml-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border border-alert-warning-border bg-alert-warning-surface px-3 py-2">
        <Typography variant="paragraph-mini-medium" color="muted" as="dt">
          {IMPACT_TODAY_LABEL}
        </Typography>
        <Typography variant="paragraph-mini" as="dd">
          {restriction.today}
        </Typography>
        <Typography variant="paragraph-mini-medium" color="muted" as="dt">
          {IMPACT_AFTER_LABEL}
        </Typography>
        <Typography variant="paragraph-mini" as="dd">
          {restriction.after}
        </Typography>
      </dl>
    )}
  </div>
)

export default SpendingLimitImpactRow
