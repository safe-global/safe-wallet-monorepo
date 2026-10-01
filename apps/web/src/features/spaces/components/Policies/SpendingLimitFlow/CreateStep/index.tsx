import { useContext, useState, type ReactElement } from 'react'
import { parseSafeScopeKey, useSafeScope, useSafeScopeControls } from '@/components/tx-flow/safe-scope'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import { MixpanelEventParams, trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { useParentSafeWalletNotice } from '../../hooks/useParentSafeWalletNotice'
import { findSafeAccount } from '../../SafeAccountSelector/utils'
import { PARENT_SAFE_WALLET_COPY } from '../constants'
import { useSpendingLimitSafeAccounts } from '../hooks/useSpendingLimitSafeAccounts'
import SpendingLimitPolicyForm from './SpendingLimitPolicyForm'
import { createDefaultFormValues, type SpendingLimitPolicyFormValues } from '../types'

export type CreateSpendingLimitPolicyProps = {
  isCalloutDismissed: boolean
  onDismissCallout: () => void
}

/** Step 1: connects the form to the flow data, the eligible accounts and the SafeScope. */
const CreateSpendingLimitPolicy = ({
  isCalloutDismissed,
  onDismissCallout,
}: CreateSpendingLimitPolicyProps): ReactElement => {
  const { data: formValues, onNext } = useContext<TxFlowContextType<SpendingLimitPolicyFormValues>>(TxFlowContext)
  const { accounts, isLoading, isError, refetch, hasWallet } = useSpendingLimitSafeAccounts()
  const { setScope } = useSafeScopeControls()
  const scopeKey = useSafeScope()?.scopeKey
  const { notice: parentSafeWallet, isChecking } = useParentSafeWalletNotice(
    findSafeAccount(accounts, scopeKey),
    PARENT_SAFE_WALLET_COPY,
  )

  // Address-poisoning check for every spender, as the Safe-level form does for its beneficiary.
  const [spenderAddresses, setSpenderAddresses] = useState<string[]>([])
  useSafeShieldForAddressPoisoning(spenderAddresses)

  const handleSubmit = (values: SpendingLimitPolicyFormValues) => {
    trackEvent(POLICY_EVENTS.SPENDING_LIMIT_SET, {
      [MixpanelEventParams.CHAIN_ID]: parseSafeScopeKey(values.safe)?.chainId,
      [MixpanelEventParams.SPENDER_COUNT]: values.spenders.length,
      [MixpanelEventParams.LIMIT_COUNT]: values.spenders.reduce((count, spender) => count + spender.limits.length, 0),
    })
    onNext(values)
  }

  return (
    <SpendingLimitPolicyForm
      defaultValues={formValues ?? createDefaultFormValues()}
      onSubmit={handleSubmit}
      accounts={accounts}
      isAccountsLoading={isLoading}
      isAccountsError={isError}
      onRetryAccounts={refetch}
      hasWallet={hasWallet}
      onSafeChange={setScope}
      scopeKey={scopeKey}
      onSpendersChange={setSpenderAddresses}
      isCalloutDismissed={isCalloutDismissed}
      onDismissCallout={onDismissCallout}
      parentSafeWallet={parentSafeWallet}
      isCheckingWallet={isChecking}
    />
  )
}

export default CreateSpendingLimitPolicy
