import type { ReactElement } from 'react'
import { Drawer, DrawerBody } from '@/components/common/Drawer'
import { useChain } from '@/hooks/useChains'
import { usePolicyGuardDelay } from '@/features/policy-guard'
import { getBlockExplorerLink } from '@/utils/chains'
import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '@/features/spaces/utils/safeHref'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import { getPolicyIcon } from '@safe-global/views/features/spaces/components/Policies/utils/policyIcon'
import { getPolicyLabel } from '@safe-global/views/features/spaces/components/Policies/utils/policyLabel'
import { getPolicyTokens } from '../utils/policyTokens'
import { getAllowlistRecipients } from '@safe-global/views/features/spaces/components/Policies/utils/allowlistRecipients'
import { PendingBanner } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/components/PendingBanner'
import {
  getPolicyStatus,
  type FailedAllowlistPolicy,
  type PolicyStatus,
  type QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import type { Viewer } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/resolveState'
import {
  ACTIVATED_BANNER_TITLE,
  activatedBannerLine,
  applyInLabel,
  timeToSignLine,
  type AllowlistTxOutcome,
  type ApplyBannerDetails,
  type ApplyStage,
} from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/messages'
import { formatPolicyChangeDelay } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'
import { PolicyDrawerHeader } from '../components/PolicyDrawerHeader'
import { PendingSignatures } from '../SpendingLimitDrawer/components/PendingSignatures'
import { PolicyOverview } from '../SpendingLimitDrawer/components/PolicyOverview'
import {
  inferAllowlistOutcome,
  resolveAllowlistDrawerState,
  type ActiveAllowlistPolicy,
  type AllowlistDrawerState,
} from './resolveState'
import AllowlistActions from './components/AllowlistActions'
import AllowlistRecipients from './components/AllowlistRecipients'
import AllowlistTokens from './components/AllowlistTokens'
import ActivatedBanner from './components/ActivatedBanner'
import FailedBanner from './components/FailedBanner'
import ApplyStatus from './components/ApplyStatus'
import UncoveredSpendingLimits from './components/UncoveredSpendingLimits'

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
  /** Requests the removal, which deletes every rule once the guard's delay is over. */
  onRemove?: () => void
  /** Takes the guard off once the removal is applied. */
  onRemoveGuard?: () => void
  /** Drops an expired request. */
  onDiscard?: () => void
  /** The Safe's threshold and owner count, which the ready-to-apply banner names. */
  signatures?: ApplyBannerDetails['signatures']
  /** Opens the apply flow (`applyConfiguration`) once the guard's delay is over. */
  onApply?: () => void
  /** The first setup just became active: confirms it once at the top of the panel. */
  justActivated?: boolean
  /** The Safe's spending limits that bypass the allowlist because the guard is not in the module slot. */
  uncoveredSpendingLimitCount?: number
}

type PendingAllowlistDrawerProps = AllowlistDrawerBaseProps & {
  /** A failed row from the table can be passed as is: the drawer reads the outcome from its status. */
  policy: QueuedAllowlistPolicy | FailedAllowlistPolicy
  transactionLink?: string
  /** Opens the queued transaction's review; absent until the transaction has loaded. */
  onReviewTransaction?: () => void
  /** Set once the queued transaction has left the queue: the panel reports why instead of offering a CTA. */
  outcome?: AllowlistTxOutcome
}

export type AllowlistDrawerProps = ActiveAllowlistDrawerProps | PendingAllowlistDrawerProps

const isPendingDrawer = (props: AllowlistDrawerProps): props is PendingAllowlistDrawerProps =>
  props.policy.status !== 'active'

const APPLY_STAGE: Partial<Record<AllowlistDrawerState['kind'], ApplyStage>> = {
  scheduled: 'waiting',
  'ready-to-apply': 'ready',
  'expired-request': 'expired',
}

/** Executed reads Pending while it waits out the delay; replaced and deleted can never execute, so they read Failed. */
const OUTCOME_STATUS: Record<AllowlistTxOutcome, PolicyStatus | null> = {
  executed: 'pending',
  failed: 'failed',
  replaced: 'failed',
  deleted: 'failed',
  expired: null,
}

const AllowlistDrawer = (props: AllowlistDrawerProps): ReactElement => {
  const { open, onClose, policy, viewer, safe, overview, names, onConnectWallet } = props
  const chain = useChain(policy.safe.chainId)
  const spaceId = useUrlSpaceId()
  const guardAddress = policy.enforcement.via === 'guard' ? policy.enforcement.guardAddress : undefined
  const enforcedByHref = chain && guardAddress ? getBlockExplorerLink(chain, guardAddress)?.href : undefined
  const changeDelay = formatPolicyChangeDelay(usePolicyGuardDelay(policy.safe.chainId, guardAddress))

  const now = Date.now()
  const outcome = isPendingDrawer(props) ? (props.outcome ?? inferAllowlistOutcome(props.policy, now)) : undefined
  const state = resolveAllowlistDrawerState(policy, viewer, safe.name ?? 'this Safe account', outcome, now, changeDelay)
  const Icon = getPolicyIcon(policy.type)
  const status = outcome
    ? OUTCOME_STATUS[outcome]
    : state.kind === 'expired-request'
      ? 'expired'
      : getPolicyStatus(policy)
  const scheduledChange = policy.status === 'active' ? policy.scheduledChange : undefined
  const applyStage = scheduledChange ? APPLY_STAGE[state.kind] : undefined
  const isRemoved = 'operation' in state && state.operation === 'remove'
  const removesGuard = policy.status !== 'active' && !!policy.removesGuard
  const recipients = getAllowlistRecipients(policy.data)
  const actions = isPendingDrawer(props)
    ? { transactionLink: props.transactionLink, onReviewTransaction: props.onReviewTransaction }
    : {
        onRemove: props.onRemove,
        onRemoveGuard: props.onRemoveGuard,
        onApply: props.onApply,
        onDiscard: props.onDiscard,
        applyLaterLabel: scheduledChange ? applyInLabel(scheduledChange.appliesAt, now) : undefined,
      }

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={getPolicyLabel(policy)}>
      <PolicyDrawerHeader icon={Icon} title={getPolicyLabel(policy)} status={status} />

      <DrawerBody>
        <div className="flex flex-col gap-6">
          {state.kind === 'pending' && (
            <>
              <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />
              <PendingSignatures
                safe={safe}
                signed={state.signed}
                required={state.required}
                timeToSign={
                  policy.status === 'pending' && policy.expiresAt ? timeToSignLine(policy.expiresAt, now) : undefined
                }
              />
            </>
          )}
          {(state.kind === 'unenforced' || state.kind === 'remove-guard') && (
            <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />
          )}
          {state.kind === 'active' && !isPendingDrawer(props) && props.justActivated && (
            <ActivatedBanner
              title={ACTIVATED_BANNER_TITLE}
              line2={activatedBannerLine(safe.name ?? 'This Safe account', recipients.length, changeDelay)}
            />
          )}
          {applyStage && scheduledChange && (
            <ApplyStatus
              stage={applyStage}
              change={scheduledChange}
              safe={safe}
              signatures={isPendingDrawer(props) ? undefined : props.signatures}
              nowMs={now}
            />
          )}
          {state.kind === 'closed' &&
            (status === 'failed' ? (
              <FailedBanner title={state.bannerTitle} line2={state.bannerLine2} />
            ) : (
              <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />
            ))}
          {state.kind !== 'remove-guard' && !removesGuard && (
            <>
              <AllowlistRecipients recipients={recipients} names={names} isRemoved={isRemoved} />
              <AllowlistTokens tokens={getPolicyTokens(policy)} isRemoved={isRemoved} />
            </>
          )}
          {!isPendingDrawer(props) &&
            !applyStage &&
            state.kind !== 'unenforced' &&
            !!props.uncoveredSpendingLimitCount && (
              <UncoveredSpendingLimits count={props.uncoveredSpendingLimitCount} />
            )}
          {!applyStage && (
            <PolicyOverview
              {...overview}
              appliesTo={{
                ...safe,
                href: buildSafeHref(AppRoutes.settings.setup, chain?.shortName, policy.safe.address, spaceId),
              }}
              chainId={policy.safe.chainId}
              enforcedBy={
                state.kind === 'unenforced' ? undefined : { label: overview.enforcedBy, href: enforcedByHref }
              }
            />
          )}
        </div>
      </DrawerBody>

      <AllowlistActions state={state} onConnectWallet={onConnectWallet} {...actions} />
    </Drawer>
  )
}

export default AllowlistDrawer
