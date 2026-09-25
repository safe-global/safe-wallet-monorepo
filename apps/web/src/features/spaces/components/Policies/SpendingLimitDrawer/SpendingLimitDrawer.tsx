import type { ReactElement } from 'react'
import { Drawer, DrawerBody, DrawerHeader, DrawerTitle } from '@/components/common/Drawer'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import { getPolicyIcon } from '../utils/policyIcon'
import { getPolicyLabel } from '../utils/policyLabel'
import type { AccountIdentityProps } from '../components/AccountIdentity'
import { PendingBanner } from './components/PendingBanner'
import { PendingSignatures } from './components/PendingSignatures'
import { PolicyOverview } from './components/PolicyOverview'
import { SpendingLimitActions } from './components/SpendingLimitActions'
import { SpendingLimits } from './components/SpendingLimits'
import PolicyStatusChip from '../components/PolicyStatusChip'
import { getPolicyStatus } from '../types'
import { resolveSpendingLimitDrawerState, type DrawerPolicy, type Viewer } from './resolveState'

export type SpendingLimitDrawerProps = {
  open: boolean
  onClose: () => void
  policy: DrawerPolicy
  viewer: Viewer
  /** The Safe the policy applies to. The overview's "applies to" row derives from it. */
  safe: { address: string; name?: string }
  overview: {
    /** Not supplied for spending limits — CGW returns no initiator. */
    initiatedBy?: AccountIdentityProps
    lastUpdated: string
    enforcedBy: string
  }
  names?: Record<string, string>
  transactionLink: string
  onEdit: () => void
  onReviewTransaction: () => void
  onConnectWallet: () => void
}

const SpendingLimitDrawer = ({
  open,
  onClose,
  policy,
  viewer,
  safe,
  overview,
  names,
  ...actions
}: SpendingLimitDrawerProps): ReactElement => {
  const chain = useChain(policy.safe.chainId)
  // Derived here rather than asked of the caller: the policy already carries the module and the chain.
  const enforcedByHref =
    chain && policy.enforcement.via === 'module'
      ? getBlockExplorerLink(chain, policy.enforcement.moduleAddress)?.href
      : undefined

  const state = resolveSpendingLimitDrawerState(policy, viewer, safe.name ?? 'this Safe account')
  const Icon = getPolicyIcon(policy.type)
  const isPending = state.kind === 'pending'

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={getPolicyLabel(policy)}>
      <DrawerHeader>
        <div className="flex size-10 items-center justify-center rounded-lg bg-success-subtle">
          <Icon className="size-4 text-success-strong" />
        </div>
        <DrawerTitle size="lg">{getPolicyLabel(policy)}</DrawerTitle>
        <div className="ml-auto">
          <PolicyStatusChip status={getPolicyStatus(policy)} />
        </div>
      </DrawerHeader>

      <DrawerBody>
        <div className="flex flex-col gap-6">
          {isPending && <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />}
          {isPending && <PendingSignatures safe={safe} signed={state.signed} required={state.required} />}
          <SpendingLimits spenders={policy.data.spenders} names={names} showUsage={!isPending} />
          <PolicyOverview {...overview} appliesTo={safe} enforcedByHref={enforcedByHref} />
        </div>
      </DrawerBody>

      <SpendingLimitActions state={state} {...actions} />
    </Drawer>
  )
}

export default SpendingLimitDrawer
