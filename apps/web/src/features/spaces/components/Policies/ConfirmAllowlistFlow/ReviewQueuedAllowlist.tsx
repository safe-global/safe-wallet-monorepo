import { useContext, type ReactElement } from 'react'
import { SafeTxContext } from '@safe-global/views/components/tx-flow/SafeTxContext'
import ConfirmProposedTx from '@/components/tx-flow/flows/ConfirmTx/ConfirmProposedTx'
import type { ReviewTransactionProps } from '@/components/tx/ReviewTransactionV2'
import type { PolicyConfiguration } from '@/features/policy-guard'
import AllowlistTransactionCalls from '../RecipientAllowlistFlow/ReviewStep/AllowlistTransactionCalls'

export type ReviewQueuedAllowlistProps = ReviewTransactionProps & {
  /** What CGW stored for a queued request, whose calldata carries only their root. */
  requestedConfigurations?: PolicyConfiguration[]
}

/** The confirm review of a queued allowlist transaction, with its calls rule by rule instead of the generic decoding. */
const ReviewQueuedAllowlist = ({
  requestedConfigurations,
  children,
  ...props
}: ReviewQueuedAllowlistProps): ReactElement => {
  const { safeTx } = useContext(SafeTxContext)

  return (
    <ConfirmProposedTx {...props} withDecodedData={false} withMultisend={false}>
      {children}
      <AllowlistTransactionCalls safeTx={safeTx} requestedConfigurations={requestedConfigurations} />
    </ConfirmProposedTx>
  )
}

export default ReviewQueuedAllowlist
