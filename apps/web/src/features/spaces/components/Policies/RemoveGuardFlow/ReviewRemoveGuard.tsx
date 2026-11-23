import { useContext, type ReactElement } from 'react'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import { useSafeScope } from '@safe-global/views/components/tx-flow/safe-scope'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import {
  REMOVE_GUARD_REVIEW_STEP_TITLE,
  REMOVE_GUARD_SUMMARY_DESCRIPTION,
  REMOVE_GUARD_SUMMARY_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import { getDefaultFallbackHandlerAddress } from '@/features/policy-guard/public/services/fallbackHandlers'
import AllowlistTransactionCalls from '../RecipientAllowlistFlow/ReviewStep/AllowlistTransactionCalls'
import type { RemoveGuardFlowProps } from '.'
import { useBuildRemoveGuardTransaction } from './useBuildRemoveGuardTransaction'

/** The last transaction of a removal: it takes the guard off both slots and sets the CompatibilityFallbackHandler. */
const ReviewRemoveGuard = ({ children, ...props }: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<RemoveGuardFlowProps>>(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  const scope = useSafeScope()
  const chainId = scope?.chainId
  const version = scope?.safe?.version
  const fallbackHandler = chainId && version ? getDefaultFallbackHandlerAddress(chainId, version) : undefined
  useBuildRemoveGuardTransaction(data?.guardAddress ?? '', fallbackHandler, data?.cleanupConfigurations)

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
