import { useMemo, type ReactElement, type ReactNode } from 'react'
import AllowlistSummary from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSummary'
import type { RecipientAllowlistFormValues } from '../types'
import { getAllowedTokenAddresses } from '../utils/allowlistForm'
import { getAllowlistRecipientLabel, toAllowlistRecipients, toAllowlistTokens } from '../utils/allowlistDisplay'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
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
  /** The policy guard is already installed, so changes wait out the delay before they apply. */
  isGuardEnabled?: boolean
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
  isGuardEnabled,
  dismissedCallouts,
  onDismissCallout,
  children,
}: RecipientAllowlistFormProps): ReactElement => {
  const { addresses, options } = heldTokens
  const chainId = account?.chainId
  const addressBook = useMergedAddressBooks(chainId)

  const tokenSymbols = useMemo(
    () => toAllowlistTokens(getAllowedTokenAddresses(addresses, values), options).map(({ symbol }) => symbol),
    [addresses, options, values],
  )
  const recipientNames = useMemo(
    () => toAllowlistRecipients(values, addressBook, chainId).map(getAllowlistRecipientLabel),
    [values, addressBook, chainId],
  )

  return (
    <>
      {showSections && (
        <AllowlistSummary
          accountLabel={account?.label}
          tokenSymbols={tokenSymbols}
          recipientNames={recipientNames}
          isGuardEnabled={isGuardEnabled}
        />
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
