import { useContext, useMemo, type ReactElement } from 'react'
import type { PendingAllowlistPolicy } from '@safe-global/views/features/spaces/components/Policies/types'
import { TxModalContext } from '@/components/tx-flow'
import type { PolicyConfiguration } from '@/features/policy-guard/public/types'
import AllowlistDrawer from '../AllowlistDrawer/AllowlistDrawer'
import ConfirmAllowlistFlow from '../ConfirmAllowlistFlow'
import { usePendingTransactionLinks } from '../SpendingLimitDetails/hooks/usePendingSpendingLimitActions'
import { usePolicyDetailsBase } from '../hooks/usePolicyDetailsBase'
import { useIsBehindLowerNonce } from './hooks/useIsBehindLowerNonce'
import { applyTxOutcome } from '../utils/allowlistStatus'
import { getAllowlistRecipients } from '@safe-global/views/features/spaces/components/Policies/utils/allowlistRecipients'

const ENFORCED_BY = 'Safe policy contract'

export type PendingAllowlistDetailsProps = {
  policy: PendingAllowlistPolicy
  /** The row has left the list: the panel stays to report why. */
  isUnlisted?: boolean
  /** What CGW stored for a queued request, so its review can list the rules its root commits to. */
  requestedConfigurations?: PolicyConfiguration[]
  onClose: () => void
}

/** A queued allowlist transaction, such as the `applyConfiguration` of a delayed change, in the recycled pending panel. */
const PendingAllowlistDetails = ({
  policy,
  isUnlisted = false,
  requestedConfigurations,
  onClose,
}: PendingAllowlistDetailsProps): ReactElement => {
  // An edit's removed recipients are listed too, so they need names as well.
  const recipients = useMemo(
    () => policy.data.changes?.recipients.map(({ address }) => address) ?? getAllowlistRecipients(policy.data),
    [policy.data],
  )
  const base = usePolicyDetailsBase(policy.safe, recipients)
  const { confirmationsSubmitted, viewer, transactionLink, txSummary, outcome } = usePendingTransactionLinks(
    policy,
    base.viewer,
    isUnlisted,
  )
  // A listed row already carries what its transaction says; one that left the list has no table row to agree with.
  const drawerPolicy = isUnlisted
    ? applyTxOutcome(
        { ...policy, confirmationsSubmitted: confirmationsSubmitted ?? policy.confirmationsSubmitted },
        outcome,
      )
    : policy
  const isBehindLowerNonce = useIsBehindLowerNonce(
    drawerPolicy,
    drawerPolicy.status === 'pending' && drawerPolicy.confirmationsSubmitted >= drawerPolicy.confirmationsRequired,
  )
  const { txFlow, setTxFlow } = useContext(TxModalContext)
  const onReviewTransaction =
    txSummary && !isUnlisted
      ? () =>
          setTxFlow(
            <ConfirmAllowlistFlow
              chainId={policy.safe.chainId}
              safeAddress={policy.safe.address}
              txSummary={txSummary}
              requestedConfigurations={requestedConfigurations}
            />,
          )
      : undefined

  return (
    <AllowlistDrawer
      open={!txFlow}
      onClose={onClose}
      policy={drawerPolicy}
      viewer={viewer}
      safe={base.safe}
      names={base.names}
      overview={{ enforcedBy: ENFORCED_BY }}
      onConnectWallet={base.onConnectWallet}
      transactionLink={transactionLink}
      onReviewTransaction={onReviewTransaction}
      failureReason={outcome === 'replaced' || outcome === 'deleted' ? outcome : undefined}
      isBehindLowerNonce={isBehindLowerNonce}
    />
  )
}

export default PendingAllowlistDetails
