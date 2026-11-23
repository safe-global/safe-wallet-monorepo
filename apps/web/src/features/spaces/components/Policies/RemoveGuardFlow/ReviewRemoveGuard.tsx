import { useContext, type ReactElement } from 'react'
import StatusAlert from '@safe-global/views/components/common/StatusAlert'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import {
  DEFAULT_FALLBACK_HANDLER_DESCRIPTION,
  DEFAULT_FALLBACK_HANDLER_TITLE,
  REMOVE_GUARD_REVIEW_STEP_TITLE,
  REMOVE_GUARD_SUMMARY_DESCRIPTION,
  REMOVE_GUARD_SUMMARY_TITLE,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import ReviewTransaction, { type ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import AllowlistTransactionCalls from '../RecipientAllowlistFlow/ReviewStep/AllowlistTransactionCalls'
import type { RemoveGuardFlowProps } from '.'
import { useBuildRemoveGuardTransaction } from './useBuildRemoveGuardTransaction'
import { usePreviousFallbackHandler } from './usePreviousFallbackHandler'

/** The last transaction of a removal: it takes the guard off both slots and sets the fallback handler back. */
const ReviewRemoveGuard = ({ children, ...props }: ReviewTransactionProps): ReactElement => {
  const { data } = useContext<TxFlowContextType<RemoveGuardFlowProps>>(TxFlowContext)
  const { safeTx } = useContext(SafeTxContext)
  const fallbackHandler = usePreviousFallbackHandler()
  useBuildRemoveGuardTransaction(data?.guardAddress ?? '', fallbackHandler?.address, data?.cleanupConfigurations)

  return (
    <ReviewTransaction {...props} title={REMOVE_GUARD_REVIEW_STEP_TITLE} withDecodedData={false} withMultisend={false}>
      <StatusAlert
        tone="info"
        title={REMOVE_GUARD_SUMMARY_TITLE}
        description={REMOVE_GUARD_SUMMARY_DESCRIPTION}
        data-testid="remove-guard-summary"
      />
      {fallbackHandler?.isDefault && (
        <StatusAlert
          tone="warning"
          title={DEFAULT_FALLBACK_HANDLER_TITLE}
          description={DEFAULT_FALLBACK_HANDLER_DESCRIPTION}
          data-testid="remove-guard-default-fallback-handler"
        />
      )}
      {children}
      <AllowlistTransactionCalls safeTx={safeTx} />
    </ReviewTransaction>
  )
}

export default ReviewRemoveGuard
