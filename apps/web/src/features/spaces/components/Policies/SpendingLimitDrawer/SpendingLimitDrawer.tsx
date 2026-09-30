import type { ReactElement } from 'react'
import { Drawer, DrawerBody } from '@/components/common/Drawer'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import { getPolicyIcon } from '../utils/policyIcon'
import { getPolicyLabel } from '../utils/policyLabel'
import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '@/features/spaces/utils/safeHref'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { PendingBanner } from './components/PendingBanner'
import { PendingSignatures } from './components/PendingSignatures'
import { PolicyOverview, type PolicyOverviewProps } from './components/PolicyOverview'
import { SpendingLimitActions } from './components/SpendingLimitActions'
import { SpendingLimits } from './components/SpendingLimits'
import { PolicyDrawerHeader } from '../components/PolicyDrawerHeader'
import { getPolicyStatus, type PendingSpendingLimitPolicy } from '../types'
import { resolveSpendingLimitDrawerState, type ActiveDrawerPolicy, type Viewer } from './resolveState'

type SpendingLimitDrawerBaseProps = {
  open: boolean
  onClose: () => void
  viewer: Viewer
  /** The Safe the policy applies to. The overview's "applies to" row derives from it. */
  safe: { address: string; name?: string }
  overview: Omit<PolicyOverviewProps, 'appliesTo' | 'enforcedByHref'>
  names?: Record<string, string>
  onConnectWallet: () => void
}

type ActiveSpendingLimitDrawerProps = SpendingLimitDrawerBaseProps & {
  policy: ActiveDrawerPolicy
  /** Arrives with WA-3156; without it the footer's `Edit` stays disabled. */
  onEdit?: () => void
}

type PendingSpendingLimitDrawerProps = SpendingLimitDrawerBaseProps & {
  policy: PendingSpendingLimitPolicy & { status: 'pending' }
  transactionLink: string
  onReviewTransaction: () => void
}

export type SpendingLimitDrawerProps = ActiveSpendingLimitDrawerProps | PendingSpendingLimitDrawerProps

const isPendingDrawer = (props: SpendingLimitDrawerProps): props is PendingSpendingLimitDrawerProps =>
  props.policy.status === 'pending'

const SpendingLimitDrawer = (props: SpendingLimitDrawerProps): ReactElement => {
  const { open, onClose, policy, viewer, safe, overview, names, onConnectWallet } = props
  const chain = useChain(policy.safe.chainId)
  const spaceId = useUrlSpaceId()
  // Derived here rather than asked of the caller: the policy already carries the module and the chain.
  const enforcedByHref =
    chain && policy.enforcement.via === 'module'
      ? getBlockExplorerLink(chain, policy.enforcement.moduleAddress)?.href
      : undefined

  const state = resolveSpendingLimitDrawerState(policy, viewer, safe.name ?? 'this Safe account')
  const Icon = getPolicyIcon(policy.type)
  const isPending = state.kind === 'pending'
  const actions = isPendingDrawer(props)
    ? { pending: { transactionLink: props.transactionLink, onReviewTransaction: props.onReviewTransaction } }
    : { onEdit: props.onEdit }

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={getPolicyLabel(policy)}>
      <PolicyDrawerHeader icon={Icon} title={getPolicyLabel(policy)} status={getPolicyStatus(policy)} />

      <DrawerBody>
        <div className="flex flex-col gap-6">
          {isPending && <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />}
          {isPending && <PendingSignatures safe={safe} signed={state.signed} required={state.required} />}
          <SpendingLimits spenders={policy.data.spenders} names={names} showUsage={state.kind === 'active'} />
          <PolicyOverview
            {...overview}
            appliesTo={{
              ...safe,
              href: buildSafeHref(AppRoutes.settings.setup, chain?.shortName, policy.safe.address, spaceId),
            }}
            enforcedByHref={enforcedByHref}
          />
        </div>
      </DrawerBody>

      <SpendingLimitActions state={state} onConnectWallet={onConnectWallet} {...actions} />
    </Drawer>
  )
}

export default SpendingLimitDrawer
