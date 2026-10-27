import { useContext, useMemo, type ReactElement } from 'react'
import type { PendingAllowlistPolicy } from '@safe-global/views/features/spaces/components/Policies/types'
import { TxModalContext } from '@/components/tx-flow'
import { AllowlistDrawer } from '../AllowlistDrawer'
import { usePendingPolicyActions } from '../SpendingLimitDetails/hooks/usePendingSpendingLimitActions'
import { usePolicyDetailsBase } from '../../hooks/usePolicyDetailsBase'
import { getAllowlistRecipients } from '@safe-global/views/features/spaces/components/Policies/utils/allowlistRecipients'

const ENFORCED_BY = 'Safe policy contract'

export type PendingAllowlistDetailsProps = {
  policy: PendingAllowlistPolicy
  /** The row has left the list: the panel stays to report why. */
  isUnlisted?: boolean
  onClose: () => void
}

/** A queued allowlist transaction, such as the `applyConfiguration` of a delayed change, in the recycled pending panel. */
const PendingAllowlistDetails = ({
  policy,
  isUnlisted = false,
  onClose,
}: PendingAllowlistDetailsProps): ReactElement => {
  const recipients = useMemo(() => getAllowlistRecipients(policy.data), [policy.data])
  const base = usePolicyDetailsBase(policy.safe, recipients)
  const {
    policy: queued,
    viewer,
    transactionLink,
    reviewTransactionHref,
    outcome,
  } = usePendingPolicyActions(policy, base.viewer, isUnlisted)
  const { txFlow } = useContext(TxModalContext)

  return (
    <AllowlistDrawer
      open={!txFlow}
      onClose={onClose}
      policy={policy.status === 'failed' ? policy : queued}
      viewer={viewer}
      safe={base.safe}
      names={base.names}
      overview={{ enforcedBy: ENFORCED_BY }}
      onConnectWallet={base.onConnectWallet}
      transactionLink={transactionLink}
      reviewTransactionHref={reviewTransactionHref}
      outcome={outcome}
    />
  )
}

export default PendingAllowlistDetails
