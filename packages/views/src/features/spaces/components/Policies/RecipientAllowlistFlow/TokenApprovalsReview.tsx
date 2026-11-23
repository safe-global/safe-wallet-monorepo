import type { ReactElement, ReactNode } from 'react'
import StatusAlert, { type StatusAlertTone } from '@safe-global/views/components/common/StatusAlert'
import { Card } from '@safe-global/views/components/ui/card'
import { Typography } from '@safe-global/views/components/ui/typography'
import { TOKEN_APPROVALS_DESCRIPTION, TOKEN_APPROVALS_TITLE } from './constants'

export type TokenApprovalRowProps = {
  key: string
  /** The token's icon and symbol. */
  token: ReactNode
  /** The spender's identity, e.g. an avatar with its address book name. */
  spender: ReactNode
  /** e.g. `1,000 USDC` or `Unlimited`. */
  amount: string
}

export type TokenApprovalsReviewProps = {
  rows: TokenApprovalRowProps[]
  /** Whether the list is complete, or why it may not be. */
  notice?: {
    tone: Extract<StatusAlertTone, 'warning' | 'success'>
    title: string
    description?: string
    action?: ReactNode
  }
}

/** The open token approvals a first setup revokes, on the review. */
const TokenApprovalsReview = ({ rows, notice }: TokenApprovalsReviewProps): ReactElement => (
  <div className="flex flex-col gap-3" data-testid="allowlist-token-approvals">
    {rows.length > 0 && (
      <Card variant="muted" size="none" radius="lg">
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <Typography variant="paragraph-small-medium">{TOKEN_APPROVALS_TITLE}</Typography>
            <Typography variant="paragraph-small" color="muted">
              {TOKEN_APPROVALS_DESCRIPTION}
            </Typography>
          </div>
          {rows.map(({ key, token, spender, amount }) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-lg bg-card p-3"
              data-testid="allowlist-token-approval"
            >
              <div className="flex shrink-0 items-center gap-2">{token}</div>
              <div className="flex min-w-0 flex-1 items-center gap-2 text-sm leading-none font-medium">{spender}</div>
              <Typography variant="paragraph-small-medium" className="shrink-0">
                {amount}
              </Typography>
            </div>
          ))}
        </div>
      </Card>
    )}

    {notice && <StatusAlert {...notice} data-testid="allowlist-token-approvals-notice" />}
  </div>
)

export default TokenApprovalsReview
