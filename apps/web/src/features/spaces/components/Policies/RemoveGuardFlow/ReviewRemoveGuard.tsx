import { useContext, type ReactElement } from 'react'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import {
  REMOVE_GUARD_REVIEW_STEP_TITLE,
  REMOVE_GUARD_SUMMARY_DESCRIPTION,
  REMOVE_GUARD_SUMMARY_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import AllowlistTransactionCalls from '../RecipientAllowlistFlow/ReviewStep/AllowlistTransactionCalls'
import { useBuildRemoveGuardTransaction } from './useBuildRemoveGuardTransaction'

/** The last transaction of a removal: it takes the guard off both slots. */
const ReviewRemoveGuard = ({ children, ...props }: ReviewTransactionProps): ReactElement => {
  const { safeTx } = useContext(SafeTxContext)
  useBuildRemoveGuardTransaction()

  return (
    <ReviewTransaction {...props} title={REMOVE_GUARD_REVIEW_STEP_TITLE} withDecodedData={false} withMultisend={false}>
      <StatusAlert
        tone="info"
        title={REMOVE_GUARD_SUMMARY_TITLE}
        description={REMOVE_GUARD_SUMMARY_DESCRIPTION}
        data-testid="remove-guard-summary"
      />
      {children}
      <AllowlistTransactionCalls safeTx={safeTx} />
    </ReviewTransaction>
  )
}

export default ReviewRemoveGuard
