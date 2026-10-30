import type { ReactElement } from 'react'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import { Card } from '@safe-global/views/components/ui/card'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'
import {
  SummaryLine,
  SummaryRow,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SummaryRow'
import {
  ALLOWLIST_GAP_APPROVALS,
  ALLOWLIST_GAP_DELEGATE_CALLS,
  ALLOWLIST_GAP_NATIVE,
  ALLOWLIST_GAPS_TITLE,
  getReviewRecipientsLabel,
  REVIEW_ACCOUNT_LABEL,
  REVIEW_FALLBACK_ALLOW,
  REVIEW_FALLBACK_LABEL,
  REVIEW_TOKENS_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { BlockedBadge } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/BlockedBadge'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import TokenIcon from '@/components/common/TokenIcon'
import { SafeAccountSummary } from '../../SafeAccountSelector/components/SafeAccountRow'
import RecipientIdentity from '../components/RecipientIdentity'
import type { AllowlistRecipientDisplay, AllowlistTokenDisplay } from '../utils/allowlistDisplay'
import type { InstalledFallback } from './ruleKind'

const ADDRESS_CLASS = 'flex min-w-0 items-center gap-2 text-sm leading-none font-medium'

type AllowlistPolicyDetailsProps = {
  safe: SafeAccountOption
  tokens: AllowlistTokenDisplay[]
  recipients: AllowlistRecipientDisplay[]
  fallback?: InstalledFallback
  hasNativeRule: boolean
}

/** The account on its own card, then the tokens and recipients as one card, since they are one policy. */
const AllowlistPolicyDetails = ({
  safe,
  tokens,
  recipients,
  fallback,
  hasNativeRule,
}: AllowlistPolicyDetailsProps): ReactElement => (
  <div className="flex flex-col gap-3" data-testid="allowlist-review-summary">
    <Card variant="muted" size="none" radius="lg">
      <div className="p-4">
        <SummaryRow label={REVIEW_ACCOUNT_LABEL}>
          <SafeAccountSummary account={safe} fitStats />
        </SummaryRow>
      </div>
    </Card>

    <Card variant="muted" size="none" radius="lg">
      <div className="flex flex-col p-4">
        <SummaryRow label={REVIEW_TOKENS_LABEL}>
          <SummaryLine className="flex-wrap gap-x-5 gap-y-2">
            {tokens.map(({ address, symbol, logoUri }) => (
              <span key={address} className="flex items-center gap-2">
                <span className="flex shrink-0">
                  <TokenIcon logoUri={logoUri} tokenSymbol={symbol} size={24} />
                </span>
                <Typography variant="paragraph-small-medium">{symbol}</Typography>
              </span>
            ))}
          </SummaryLine>
        </SummaryRow>

        <Separator className="my-3" />

        <SummaryRow label={getReviewRecipientsLabel(recipients.length)}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {recipients.map(({ address, name, isInAddressBook }) => (
              <div key={address} className={ADDRESS_CLASS}>
                <RecipientIdentity address={address} name={name} isInAddressBook={isInAddressBook} />
              </div>
            ))}
          </div>
        </SummaryRow>

        {fallback && (
          <>
            <Separator className="my-3" />

            <SummaryRow label={REVIEW_FALLBACK_LABEL}>
              <SummaryLine className={fallback === 'deny' ? 'justify-end' : undefined}>
                {fallback === 'allow' ? (
                  <Typography variant="paragraph-small" data-testid="allowlist-fallback">
                    {REVIEW_FALLBACK_ALLOW}
                  </Typography>
                ) : (
                  <BlockedBadge data-testid="allowlist-fallback" />
                )}
              </SummaryLine>
            </SummaryRow>
          </>
        )}
      </div>
    </Card>

    {fallback === 'allow' && (
      <StatusAlert
        tone="warning"
        title={ALLOWLIST_GAPS_TITLE}
        description={
          <ul className="list-disc pl-4">
            <li>{ALLOWLIST_GAP_APPROVALS}</li>
            {hasNativeRule && <li>{ALLOWLIST_GAP_NATIVE}</li>}
            <li>{ALLOWLIST_GAP_DELEGATE_CALLS}</li>
          </ul>
        }
        data-testid="allowlist-gaps"
      />
    )}
  </div>
)

export default AllowlistPolicyDetails
