import type { ReactElement } from 'react'
import type { LinkProps } from 'next/link'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '@/features/spaces/utils/safeHref'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import type { PolicyOverviewProps } from '@views/features/spaces/components/Policies/SpendingLimitDrawer/components/PolicyOverview'
import type { QueuedSpendingLimitPolicy } from '@views/features/spaces/components/Policies/types'
import type {
  ActiveDrawerPolicy,
  PendingTxOutcome,
  Viewer,
} from '@views/features/spaces/components/Policies/SpendingLimitDrawer/resolveState'
import { SpendingLimitDrawerView } from '@views/features/spaces/components/Policies/SpendingLimitDrawer/SpendingLimitDrawerView'

type SpendingLimitDrawerBaseProps = {
  open: boolean
  onClose: () => void
  viewer: Viewer
  /** The Safe the policy applies to. The overview's "applies to" row derives from it. */
  safe: { address: string; name?: string }
  overview: Omit<PolicyOverviewProps, 'appliesTo' | 'chainId' | 'enforcedBy'> & { enforcedBy: string }
  names?: Record<string, string>
  onConnectWallet: () => void
}

type ActiveSpendingLimitDrawerProps = SpendingLimitDrawerBaseProps & {
  policy: ActiveDrawerPolicy
  /** Arrives with WA-3156; without it the footer's `Edit` stays disabled. */
  onEdit?: () => void
  /** Only reachable while the policy is unenforced; without it the footer's CTA stays disabled. */
  onEnableModule?: () => void
}

type PendingSpendingLimitDrawerProps = SpendingLimitDrawerBaseProps & {
  policy: QueuedSpendingLimitPolicy
  transactionLink?: string
  reviewTransactionHref?: LinkProps['href']
  onRetry?: () => void
  /** Set once the queued transaction has left the queue: the panel reports why instead of offering a CTA. */
  outcome?: PendingTxOutcome
}

export type SpendingLimitDrawerProps = ActiveSpendingLimitDrawerProps | PendingSpendingLimitDrawerProps

const SpendingLimitDrawer = (props: SpendingLimitDrawerProps): ReactElement => {
  const { policy } = props
  const chain = useChain(policy.safe.chainId)
  const spaceId = useUrlSpaceId()
  // Derived here rather than asked of the caller: the policy already carries the module and the chain.
  const enforcedByHref =
    chain && policy.enforcement.via === 'module'
      ? getBlockExplorerLink(chain, policy.enforcement.moduleAddress)?.href
      : undefined

  return (
    <SpendingLimitDrawerView
      {...props}
      appliesToHref={buildSafeHref(AppRoutes.settings.setup, chain?.shortName, policy.safe.address, spaceId)}
      enforcedByHref={enforcedByHref}
    />
  )
}

export default SpendingLimitDrawer
