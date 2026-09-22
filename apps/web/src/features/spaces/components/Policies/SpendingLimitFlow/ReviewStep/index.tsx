import { useContext, useMemo, type ReactElement } from 'react'
import { SafeTxContext } from '@/components/tx-flow/SafeTxContext'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowStep } from '@/components/tx-flow/TxFlowStep'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import ReviewTransactionSkeleton from '@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton'
import useAddressBook from '@/hooks/useAddressBook'
import { useSpendingLimitSafeAccounts } from '../hooks/useSpendingLimitSafeAccounts'
import useSpendingLimitTokenOptions from '../hooks/useSpendingLimitTokenOptions'
import SpendingLimitSummary from '../Summary'
import { toPolicySummaryModel } from '../Summary/toPolicySummaryModel'
import type { SpendingLimitPolicyFormValues } from '../types'
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

  useBuildPolicyTransaction(formValues)

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
    <ReviewTransaction title={REVIEW_STEP_TITLE} onSubmit={onSubmit}>
      {summary && <SpendingLimitSummary policy={summary} />}
      {children}
    </ReviewTransaction>
  )
}

export default ReviewSpendingLimitPolicy
