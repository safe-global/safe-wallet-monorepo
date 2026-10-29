import { useContext, type ReactElement } from 'react'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import {
  formatPolicyChangeDelay,
  removeSummaryDescription,
  REMOVE_REVIEW_STEP_TITLE,
  REMOVE_SUMMARY_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { usePolicyGuardDelay } from '@/features/policy-guard'
import AllowlistTransactionCalls from '../RecipientAllowlistFlow/ReviewStep/AllowlistTransactionCalls'
import { useSaveBeforeSubmit } from '../RecipientAllowlistFlow/hooks/useSaveBeforeSubmit'
import type { RemoveAllowlistFlowData } from './types'
import { useBuildRemoveAllowlistTransaction } from './useBuildRemoveAllowlistTransaction'

/** The first transaction of a removal: it requests the deletion, which applies once the guard's delay is over. */
const ReviewRemoveAllowlist = ({ onSubmit, children, ...props }: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<RemoveAllowlistFlowData>>(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  const request = useBuildRemoveAllowlistTransaction(data?.guardAddress ?? '', data?.rules ?? [])
  const handleSubmit = useSaveBeforeSubmit(request, onSubmit)
  const changeDelay = formatPolicyChangeDelay(usePolicyGuardDelay(data?.chainId ?? '', data?.guardAddress))

  return (
    <ReviewTransaction
      {...props}
      title={REMOVE_REVIEW_STEP_TITLE}
      withDecodedData={false}
      withMultisend={false}
      onSubmit={handleSubmit}
    >
      <StatusAlert
        tone="warning"
        title={REMOVE_SUMMARY_TITLE}
        description={removeSummaryDescription(changeDelay)}
        data-testid="remove-allowlist-summary"
      />
      {children}
      <AllowlistTransactionCalls safeTx={safeTx} requestedConfigurations={request?.configurations} />
    </ReviewTransaction>
  )
}

export default ReviewRemoveAllowlist
