import type { ReactElement } from 'react'
import type { LinkProps } from 'next/link'
import { Drawer, DrawerBody } from '@/components/common/Drawer'
import { useChain } from '@/hooks/useChains'
import { getBlockExplorerLink } from '@/utils/chains'
import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '@/features/spaces/utils/safeHref'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { getPolicyIcon } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import { getPolicyLabel } from '@safe-global/views/features/spaces/components/Policies/utils/policyLabel'
import { getPolicyTokens } from '@safe-global/views/features/spaces/components/Policies/utils/policyTokens'
import { getAllowlistRecipients } from '@safe-global/views/features/spaces/components/Policies/utils/allowlistRecipients'
import { formatAppliesAt } from '@safe-global/views/features/spaces/components/Policies/utils/policyStatusDetail'
import { PendingBanner } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/components/PendingBanner'
import {
  getPolicyStatus,
  type PolicyStatus,
  type QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import type {
  PendingTxOutcome,
  Viewer,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/resolveState'
import {
  resolveAllowlistDrawerState,
  type ActiveAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/resolveState'
import { PolicyDrawerHeader } from '../components/PolicyDrawerHeader'
import { PendingSignatures } from '../SpendingLimitDrawer/components/PendingSignatures'
import { PolicyOverview } from '../SpendingLimitDrawer/components/PolicyOverview'
import AllowlistActions from './components/AllowlistActions'
import AllowlistRecipients from './components/AllowlistRecipients'
import AllowlistTokens from './components/AllowlistTokens'
import FailedBanner from './components/FailedBanner'
import ScheduledBanner from './components/ScheduledBanner'

type AllowlistDrawerBaseProps = {
  open: boolean
  onClose: () => void
  viewer: Viewer
  /** The Safe the allowlist applies to. The overview's "Safe account" row derives from it. */
  safe: { address: string; name?: string }
  overview: { lastUpdated?: string; enforcedBy: string }
  /** Address book names keyed by address, in any casing. */
  names?: Record<string, string>
  onConnectWallet: () => void
}

type ActiveAllowlistDrawerProps = AllowlistDrawerBaseProps & {
  policy: ActiveAllowlistPolicy
  onEdit?: () => void
  onRemove?: () => void
  onCancelChange?: () => void
}

type PendingAllowlistDrawerProps = AllowlistDrawerBaseProps & {
  policy: QueuedAllowlistPolicy
  transactionLink?: string
  reviewTransactionHref?: LinkProps['href']
  /** Set once the queued transaction has left the queue: the panel reports why instead of offering a CTA. */
  outcome?: PendingTxOutcome
}

export type AllowlistDrawerProps = ActiveAllowlistDrawerProps | PendingAllowlistDrawerProps

const isPendingDrawer = (props: AllowlistDrawerProps): props is PendingAllowlistDrawerProps =>
  props.policy.status === 'pending'

/** An executed change still waits out the guard's delay, so it reads Pending rather than Activating. */
const getOutcomeStatus = (outcome: PendingTxOutcome): PolicyStatus => (outcome === 'executed' ? 'pending' : 'failed')

const AllowlistDrawer = (props: AllowlistDrawerProps): ReactElement => {
  const { open, onClose, policy, viewer, safe, overview, names, onConnectWallet } = props
  const chain = useChain(policy.safe.chainId)
  const spaceId = useUrlSpaceId()
  const enforcedByHref =
    chain && policy.enforcement.via === 'guard'
      ? getBlockExplorerLink(chain, policy.enforcement.guardAddress)?.href
      : undefined

  const outcome = isPendingDrawer(props) ? props.outcome : undefined
  const state = resolveAllowlistDrawerState(policy, viewer, safe.name ?? 'this Safe account', outcome)
  const Icon = getPolicyIcon(policy.type)
  const status = outcome ? getOutcomeStatus(outcome) : getPolicyStatus(policy)
  const isRemoved = state.kind !== 'active' && state.operation === 'remove'
  const actions = isPendingDrawer(props)
    ? { transactionLink: props.transactionLink, reviewTransactionHref: props.reviewTransactionHref }
    : { onEdit: props.onEdit, onRemove: props.onRemove, onCancelChange: props.onCancelChange }

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={getPolicyLabel(policy)}>
      <PolicyDrawerHeader icon={Icon} title={getPolicyLabel(policy)} status={status} />

      <DrawerBody>
        <div className="flex flex-col gap-6">
          {state.kind === 'pending' && (
            <>
              <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />
              <PendingSignatures safe={safe} signed={state.signed} required={state.required} />
            </>
          )}
          {state.kind === 'scheduled' && policy.status === 'active' && policy.scheduledChange && (
            <ScheduledBanner
              title={state.bannerTitle}
              line2={state.bannerLine2}
              appliesAt={formatAppliesAt(policy.scheduledChange.appliesAt, Date.now())}
            />
          )}
          {state.kind === 'closed' &&
            (outcome === 'executed' ? (
              <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />
            ) : (
              <FailedBanner title={state.bannerTitle} line2={state.bannerLine2} />
            ))}
          <AllowlistRecipients recipients={getAllowlistRecipients(policy.data)} names={names} isRemoved={isRemoved} />
          <AllowlistTokens tokens={getPolicyTokens(policy)} isRemoved={isRemoved} />
          <PolicyOverview
            {...overview}
            appliesTo={{
              ...safe,
              href: buildSafeHref(AppRoutes.settings.setup, chain?.shortName, policy.safe.address, spaceId),
            }}
            chainId={policy.safe.chainId}
            enforcedBy={{ label: overview.enforcedBy, href: enforcedByHref }}
          />
        </div>
      </DrawerBody>

      <AllowlistActions state={state} onConnectWallet={onConnectWallet} {...actions} />
    </Drawer>
  )
}

export default AllowlistDrawer
