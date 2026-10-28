import { useContext, type ReactElement } from 'react'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import {
  APPLY_REVIEW_STEP_TITLE,
  APPLY_SUMMARY_DESCRIPTION,
  APPLY_SUMMARY_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import type { ApplyAllowlistFlowData } from './types'
import { useBuildApplyAllowlistTransaction } from './useBuildApplyAllowlistTransaction'

/** The second transaction of a delayed allowlist change: review, then the standard sign and execute steps. */
const ReviewApplyAllowlist = ({ children, ...props }: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<ApplyAllowlistFlowData>>(TxFlowContext)
  useBuildApplyAllowlistTransaction(data?.guardAddress ?? '', data?.configurations ?? [])

  return (
    <ReviewTransaction {...props} title={APPLY_REVIEW_STEP_TITLE}>
      <StatusAlert
        tone="info"
        title={APPLY_SUMMARY_TITLE}
        description={APPLY_SUMMARY_DESCRIPTION}
        data-testid="apply-allowlist-summary"
      />
      {children}
    </ReviewTransaction>
  )
}

export default ReviewApplyAllowlist
