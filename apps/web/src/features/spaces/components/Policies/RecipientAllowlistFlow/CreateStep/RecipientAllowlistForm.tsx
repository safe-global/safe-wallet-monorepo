import type { ReactElement, ReactNode } from 'react'
import AllowlistSummary from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/AllowlistSummary'
import { useIsEditMode } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import {
  EDIT_SUMMARY_DESCRIPTION,
  EDIT_SUMMARY_DETAILS,
  getEditSummaryTitle,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import type { RecipientAllowlistFormValues } from '../types'
import type { HeldTokenAddresses } from '../hooks/useHeldTokenAddresses'
import type { SpendingLimitTokensResult } from '../hooks/useSpendingLimitTokens'
import TokensSection from './TokensSection'

export type RecipientAllowlistFormProps = {
  values: RecipientAllowlistFormValues
  onChange: (next: RecipientAllowlistFormValues) => void
  heldTokens: HeldTokenAddresses
  spendingLimits: SpendingLimitTokensResult
  account?: { chainId: string; address: string; label: string }
  /** False when the picked Safe cannot take an allowlist: only `children` show. */
  showSections: boolean
  /** Between the edit summary and the sections: the account field and its banners. */
  children?: ReactNode
}

const RecipientAllowlistForm = ({
  values,
  onChange,
  heldTokens,
  spendingLimits,
  account,
  showSections,
  children,
}: RecipientAllowlistFormProps): ReactElement => {
  const isEditMode = useIsEditMode()
  const accountKey = account ? `${account.chainId}:${account.address}` : 'none'

  return (
    <>
      {showSections && isEditMode && account && (
        <AllowlistSummary
          title={getEditSummaryTitle(account.label)}
          description={EDIT_SUMMARY_DESCRIPTION}
          details={EDIT_SUMMARY_DETAILS}
        />
      )}

      {children}

      {showSections && (
        <div className="mt-1 flex flex-col gap-4">
          <TokensSection
            key={`tokens-${accountKey}`}
            values={values}
            onChange={onChange}
            heldTokens={heldTokens}
            spendingLimits={spendingLimits}
            hasAccount={Boolean(account)}
          />
        </div>
      )}
    </>
  )
}

export default RecipientAllowlistForm
