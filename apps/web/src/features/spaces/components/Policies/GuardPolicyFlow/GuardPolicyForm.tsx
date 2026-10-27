import type { ReactElement, ReactNode } from 'react'
import { FormProvider, type FieldValues, type UseFormReturn } from 'react-hook-form'
import TxCard, { TxCardActions } from '@safe-global/views/components/tx-flow/common/TxCard'
import { Button } from '@safe-global/views/components/ui/button'
import type { SafeAccountEntry } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import { GUARD_POLICY_NEXT_LABEL } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import { useIsEditMode } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import { findSafeAccount } from '../SafeAccountSelector/utils'
import SafeAccountField from '../SpendingLimitFlow/CreateStep/SafeAccountField'

/** What every guard policy form takes for its Safe picker; the connected step supplies them. */
export type GuardPolicyAccountProps = {
  accounts: SafeAccountEntry[]
  isAccountsLoading: boolean
  isAccountsError: boolean
  onRetryAccounts: () => void
  hasWallet: boolean
  onSafeChange: (chainId: string, address: string) => void
}

type GuardPolicyFormProps<T extends FieldValues> = GuardPolicyAccountProps & {
  formMethods: UseFormReturn<T>
  /** The form's current `safe`, watched by the caller, which knows the form's type. */
  safeId: string
  onSubmit: (values: T) => void
  /** Beyond the form's own validity, e.g. a confirmation the policy asks for. */
  submitDisabled?: boolean
  'data-testid': string
  /** The policy's own fields, below the Safe. */
  children?: ReactNode
}

/**
 * The step 1 card every guard policy shares, laid out as the spending limit's: the Safe first, then the policy's
 * fields, then Next. A Safe the picker disables (no policy engine on its chain) cannot be submitted.
 */
const GuardPolicyForm = <T extends FieldValues>({
  formMethods,
  safeId,
  onSubmit,
  submitDisabled = false,
  accounts,
  isAccountsLoading,
  isAccountsError,
  onRetryAccounts,
  hasWallet,
  onSafeChange,
  'data-testid': testId,
  children,
}: GuardPolicyFormProps<T>): ReactElement => {
  const { handleSubmit, formState } = formMethods
  // Editing is scoped to the policy's own Safe, which is already set and not re-validated here.
  const isEditMode = useIsEditMode()
  const selectedSafe = findSafeAccount(accounts, safeId)
  const isSafeBlocked = !isEditMode && (!selectedSafe || Boolean(selectedSafe.ineligibleReason))

  return (
    <TxCard>
      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" data-testid={testId}>
          <SafeAccountField
            accounts={accounts}
            isLoading={isAccountsLoading}
            isError={isAccountsError}
            onRetry={onRetryAccounts}
            hasWallet={hasWallet}
            onSafeChange={onSafeChange}
            readOnly={isEditMode}
            notice={null}
            id={`${testId}-safe-account`}
          />

          {children}

          <TxCardActions>
            <Button
              type="submit"
              size="submit"
              disabled={!formState.isValid || isSafeBlocked || submitDisabled}
              data-testid="next-btn"
            >
              {GUARD_POLICY_NEXT_LABEL}
            </Button>
          </TxCardActions>
        </form>
      </FormProvider>
    </TxCard>
  )
}

export default GuardPolicyForm
