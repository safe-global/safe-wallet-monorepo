import { useContext } from 'react'
import { useSafeScopeControls } from '@safe-global/views/components/tx-flow/safe-scope'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { GuardPolicyBaseFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import type { GuardPolicyAccountProps } from '../GuardPolicyForm'
import { useGuardPolicySafeAccounts } from './useGuardPolicySafeAccounts'

/** Step 1's connection to the flow data, the eligible accounts and the SafeScope, shared by every guard policy. */
export const useGuardPolicyStep = <T extends GuardPolicyBaseFormValues>(): {
  data: T | undefined
  onNext: (values: T) => void
  accountProps: GuardPolicyAccountProps
} => {
  const { data, onNext } = useContext<TxFlowContextType<T>>(TxFlowContext)
  const { accounts, isLoading, isError, refetch, hasWallet } = useGuardPolicySafeAccounts()
  const { setScope } = useSafeScopeControls()

  return {
    data,
    onNext,
    accountProps: {
      accounts,
      isAccountsLoading: isLoading,
      isAccountsError: isError,
      onRetryAccounts: refetch,
      hasWallet,
      onSafeChange: setScope,
    },
  }
}
