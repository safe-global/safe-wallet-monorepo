import { useContext, type ReactElement } from 'react'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import {
  APPLY_REMOVAL_REVIEW_STEP_TITLE,
  APPLY_REMOVAL_SUMMARY_DESCRIPTION,
  APPLY_REMOVAL_SUMMARY_TITLE,
  APPLY_REVIEW_STEP_TITLE,
  APPLY_SUMMARY_DESCRIPTION,
  APPLY_SUMMARY_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { isAllowlistRemoval } from '@/features/policy-guard/services'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import AllowlistTransactionCalls from '../RecipientAllowlistFlow/ReviewStep/AllowlistTransactionCalls'
import type { ApplyAllowlistFlowData } from './types'
import { useBuildApplyAllowlistTransaction } from './useBuildApplyAllowlistTransaction'

/** The second transaction of a delayed allowlist change: review, then the standard sign and execute steps. */
const ReviewApplyAllowlist = ({ children, ...props }: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<ApplyAllowlistFlowData>>(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  useBuildApplyAllowlistTransaction(data?.guardAddress ?? '', data?.configurations ?? [])
  const isRemoval = !!data && isAllowlistRemoval(data.configurations, data.safeAddress)

  return (
    <ReviewTransaction
      {...props}
      title={isRemoval ? APPLY_REMOVAL_REVIEW_STEP_TITLE : APPLY_REVIEW_STEP_TITLE}
      withDecodedData={false}
      withMultisend={false}
    >
      <StatusAlert
        tone={isRemoval ? 'warning' : 'info'}
        title={isRemoval ? APPLY_REMOVAL_SUMMARY_TITLE : APPLY_SUMMARY_TITLE}
        description={isRemoval ? APPLY_REMOVAL_SUMMARY_DESCRIPTION : APPLY_SUMMARY_DESCRIPTION}
        data-testid="apply-allowlist-summary"
      />
      {children}
      <AllowlistTransactionCalls safeTx={safeTx} />
    </ReviewTransaction>
  )
}

export default ReviewApplyAllowlist
