import { useCallback, useContext, useMemo, type ReactElement } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxContext'
import type { SubmitCallback } from '@/components/tx-flow/TxFlow'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ReviewTransactionSkeleton from '@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton'
import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import { trackEvent } from '@/services/analytics'
import { POLICY_EVENTS } from '@/services/analytics/events/policies'
import { useSpendingLimitSafeAccounts } from '../hooks/useSpendingLimitSafeAccounts'
import useSpendingLimitTokenOptions from '../hooks/useSpendingLimitTokenOptions'
import SpendingLimitSummary from '../Summary'
import { toPolicySummaryModel } from '../Summary/toPolicySummaryModel'
import type { SpendingLimitPolicyFormValues } from '../types'
import { resetPeriodEventLabel } from '../utils/resetPeriod'
import { REVIEW_STEP_TITLE } from '../constants'
import { useBuildPolicyTransaction } from './useBuildPolicyTransaction'

/**
 * Step 2, "Confirm policy": the policy in plain language on top of the shared transaction review. The multisend
 * itself is built by `useBuildPolicyTransaction` and handed to `SafeTxProvider`; the shared Sign/Execute steps
 * take over from there.
 */
const ReviewSpendingLimitPolicy = ({ onSubmit, children }: ReviewTransactionProps): ReactElement => {
  // What step 1 submitted: the selected Safe and every spender with their token limits.
  const { data: formValues } = useContext<TxFlowContextType<SpendingLimitPolicyFormValues>>(TxFlowContext)
  const { safeTx, safeTxError } = useContext(SafeTxContext)
  const { accounts } = useSpendingLimitSafeAccounts()
  const { options: tokens } = useSpendingLimitTokenOptions()
  const names = useAddressBook()
  const chainId = useChainId()

  useBuildPolicyTransaction(formValues)

  // One reset-period event per limit, as the Safe-level review reports its single one on Continue.
  const handleSubmit = useCallback<SubmitCallback>(
    (args) => {
      for (const spender of formValues?.spenders ?? []) {
        for (const limit of spender.limits) {
          trackEvent({
            ...POLICY_EVENTS.SPENDING_LIMIT_RESET_PERIOD,
            label: resetPeriodEventLabel(limit.resetTime, chainId),
          })
        }
      }
      onSubmit(args)
    },
    [formValues, chainId, onSubmit],
  )

  const summary = useMemo(
    () => (formValues ? toPolicySummaryModel(formValues, { accounts, tokens, names }) : undefined),
    [formValues, accounts, tokens, names],
  )

  if (!safeTx && !safeTxError) {
    return (
      <TxFlowStep title={REVIEW_STEP_TITLE} hideNonce>
        <ReviewTransactionSkeleton />
      </TxFlowStep>
    )
  }

  return (
    <ReviewTransaction title={REVIEW_STEP_TITLE} onSubmit={handleSubmit}>
      {summary && <SpendingLimitSummary policy={summary} />}
      {children}
    </ReviewTransaction>
  )
}

export default ReviewSpendingLimitPolicy
