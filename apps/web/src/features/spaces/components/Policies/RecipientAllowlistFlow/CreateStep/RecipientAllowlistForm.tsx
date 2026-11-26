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

const RecipientAllowlistForm = ({ account, showSections, children }: RecipientAllowlistFormProps): ReactElement => {
  const isEditMode = useIsEditMode()

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
    </>
  )
}

export default RecipientAllowlistForm
