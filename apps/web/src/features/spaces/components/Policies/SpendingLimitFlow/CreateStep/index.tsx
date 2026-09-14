import { useContext, useState, type ReactElement } from 'react'
import { useSafeScope, useSafeScopeControls } from '@/components/tx-flow/safe-scope'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import { useSpendingLimitSafeAccounts } from '../hooks/useSpendingLimitSafeAccounts'
import SpendingLimitPolicyForm from './SpendingLimitPolicyForm'
import { createDefaultFormValues, type SpendingLimitPolicyFormValues } from '../types'

/** Step 1 of `SpendingLimitFlow`: connects the form to the flow data, the eligible accounts and the SafeScope. */
const CreateSpendingLimitPolicy = (): ReactElement => {
  const { data, onNext } = useContext<TxFlowContextType<SpendingLimitPolicyFormValues>>(TxFlowContext)
  const { accounts, isLoading, isError, refetch, hasWallet } = useSpendingLimitSafeAccounts()
  const { setScope } = useSafeScopeControls()
  const scopeKey = useSafeScope()?.scopeKey

  // Copilot address-poisoning check for every spender, as the Safe-level form does for its beneficiary.
  const [spenderAddresses, setSpenderAddresses] = useState<string[]>([])
  useSafeShieldForAddressPoisoning(spenderAddresses)

  return (
    <SpendingLimitPolicyForm
      defaultValues={data ?? createDefaultFormValues()}
      onSubmit={onNext}
      accounts={accounts}
      isAccountsLoading={isLoading}
      isAccountsError={isError}
      onRetryAccounts={refetch}
      hasWallet={hasWallet}
      onSafeChange={setScope}
      scopeKey={scopeKey}
      onSpendersChange={setSpenderAddresses}
    />
  )
}

export default CreateSpendingLimitPolicy
