import type { ReactElement } from 'react'
import { Card } from '@safe-global/views/components/ui/card'
import { Separator } from '@safe-global/views/components/ui/separator'
import { Typography } from '@safe-global/views/components/ui/typography'
import {
  SummaryLine,
  SummaryRow,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/SummaryRow'
import {
  getReviewRecipientsLabel,
  REVIEW_ACCOUNT_LABEL,
  REVIEW_TOKENS_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import TokenIcon from '@/components/common/TokenIcon'
import SafeRowStats from '../../../SafeSelectorDropdown/components/SafeRowStats'
import { AccountBalance, toStatChains } from '../../SafeAccountSelector/components/SafeAccountRow'
import { SafeIdentity } from '../../components/SafeIdentity'
import RecipientIdentity from '../components/RecipientIdentity'

export type ReviewToken = { address: string; symbol: string; logoUri?: string }
export type ReviewRecipient = { address: string; name?: string; isInAddressBook: boolean }

const ADDRESS_CLASS = 'flex min-w-0 items-center gap-2 text-sm leading-none font-medium'

type AllowlistPolicyDetailsProps = {
  safe: SafeAccountOption
  tokens: ReviewToken[]
  recipients: ReviewRecipient[]
}

/** The account on its own card, then the tokens and recipients as one card, since they are one policy. */
const AllowlistPolicyDetails = ({ safe, tokens, recipients }: AllowlistPolicyDetailsProps): ReactElement => (
  <div className="flex flex-col gap-3" data-testid="allowlist-review-summary">
    <Card variant="muted" size="none" radius="lg">
      <div className="p-4">
        <SummaryRow label={REVIEW_ACCOUNT_LABEL}>
          <div className="flex min-h-10 flex-wrap items-center gap-x-8 gap-y-2">
            <div className="flex min-w-0 items-center gap-3">
              <SafeIdentity address={safe.address} name={safe.name} />
            </div>
            <SafeRowStats
              threshold={safe.threshold ?? 0}
              owners={safe.owners ?? 0}
              chains={toStatChains([safe])}
              pending={0}
              showPending={false}
              fitColumns
            />
            <AccountBalance fiatTotal={safe.fiatTotal} fitColumn />
          </div>
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
      </div>
    </Card>
  </div>
)

export default AllowlistPolicyDetails
