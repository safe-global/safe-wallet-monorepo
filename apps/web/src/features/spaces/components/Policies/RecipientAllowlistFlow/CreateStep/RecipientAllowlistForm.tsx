import { useMemo, type ReactElement, type ReactNode } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import AllowlistSummary from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSummary'
import type { RecipientAllowlistFormValues } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import {
  getAllowedTokenAddresses,
  getSelectedRecipients,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/utils/allowlistForm'
import { findTokenOption } from '../../SpendingLimitFlow/utils/tokenOptions'
import type { HeldTokenAddresses } from '../hooks/useHeldTokenAddresses'
import TokensSection from './TokensSection'
import RecipientsSection from './RecipientsSection'

export type CalloutSection = 'tokens' | 'recipients'

export type RecipientAllowlistFormProps = {
  values: RecipientAllowlistFormValues
  onChange: (next: RecipientAllowlistFormValues) => void
  heldTokens: HeldTokenAddresses
  account?: { chainId: string; address: string; label: string }
  /** False when the picked Safe cannot take an allowlist: only `children` show. */
  showSections: boolean
  dismissedCallouts: Record<CalloutSection, boolean>
  onDismissCallout: (section: CalloutSection) => void
  /** Between the summary and the sections: the account field and its banners. */
  children?: ReactNode
}

const RecipientAllowlistForm = ({
  values,
  onChange,
  heldTokens,
  account,
  showSections,
  dismissedCallouts,
  onDismissCallout,
  children,
}: RecipientAllowlistFormProps): ReactElement => {
  const { addresses, options } = heldTokens

  const tokenSymbols = useMemo(
    () =>
      getAllowedTokenAddresses(addresses, values).map(
        (address) => findTokenOption(options, address)?.symbol || shortenAddress(address),
      ),
    [addresses, options, values],
  )
  const recipientNames = useMemo(
    () => getSelectedRecipients(values).map(({ name, address }) => name || shortenAddress(address)),
    [values],
  )

  return (
    <>
      {showSections && (
        <AllowlistSummary accountLabel={account?.label} tokenSymbols={tokenSymbols} recipientNames={recipientNames} />
      )}

      {children}

      {showSections && (
        <div className="mt-1 flex flex-col gap-4">
          <TokensSection
            values={values}
            onChange={onChange}
            heldTokens={heldTokens}
            hasAccount={Boolean(account)}
            isCalloutDismissed={dismissedCallouts.tokens}
            onDismissCallout={() => onDismissCallout('tokens')}
          />
          <RecipientsSection
            key={account ? `${account.chainId}:${account.address}` : 'none'}
            values={values}
            onChange={onChange}
            safeAddress={account?.address}
            chainId={account?.chainId}
            isCalloutDismissed={dismissedCallouts.recipients}
            onDismissCallout={() => onDismissCallout('recipients')}
          />
        </div>
      )}
    </>
  )
}

export default RecipientAllowlistForm
