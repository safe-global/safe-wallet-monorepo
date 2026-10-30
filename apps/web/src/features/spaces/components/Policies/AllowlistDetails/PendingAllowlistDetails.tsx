import { useContext, useMemo, type ReactElement } from 'react'
import type {
  FailedAllowlistPolicy,
  PendingAllowlistPolicy,
  QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import { TxModalContext } from '@/components/tx-flow'
import type { PolicyConfiguration } from '@/features/policy-guard'
import { AllowlistDrawer } from '../AllowlistDrawer'
import ConfirmAllowlistFlow from '../ConfirmAllowlistFlow'
import { usePendingTransactionLinks } from '../SpendingLimitDetails/hooks/usePendingSpendingLimitActions'
import { usePolicyDetailsBase } from '../hooks/usePolicyDetailsBase'
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
  const recipients = useMemo(() => getAllowlistRecipients(policy.data), [policy.data])
  const base = usePolicyDetailsBase(policy.safe, recipients)
  const { confirmationsSubmitted, viewer, transactionLink, txSummary, outcome } = usePendingTransactionLinks(
    policy,
    base.viewer,
    isUnlisted,
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

  const drawerPolicy: QueuedAllowlistPolicy | FailedAllowlistPolicy =
    policy.status === 'failed'
      ? { ...policy, status: 'failed' }
      : {
          ...policy,
          status: 'pending',
          confirmationsSubmitted: confirmationsSubmitted ?? policy.confirmationsSubmitted,
        }

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
      outcome={outcome}
    />
  )
}

export default PendingAllowlistDetails
