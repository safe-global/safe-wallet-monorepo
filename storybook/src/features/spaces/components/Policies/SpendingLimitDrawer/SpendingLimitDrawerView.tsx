import type { ReactElement } from 'react'
import type { LinkProps } from 'next/link'
import { Drawer } from '@views/components/common/Drawer/Drawer'
import { DrawerBody } from '@views/components/common/Drawer/components/DrawerBody'
import type { SafeHref } from '@/features/spaces/utils/safeHref'
import { getPolicyIcon } from '../utils/policyIcon'
import { getPolicyLabel } from '../utils/policyLabel'
import { PendingBanner } from './components/PendingBanner'
import { PendingSignatures } from './components/PendingSignatures'
import { PolicyOverview, type PolicyOverviewProps } from './components/PolicyOverview'
import { SpendingLimitActions } from './components/SpendingLimitActions'
import { SpendingLimits } from './components/SpendingLimits'
import { PolicyDrawerHeader } from '@views/features/spaces/components/Policies/components/PolicyDrawerHeader'
import { getPolicyStatus, type QueuedSpendingLimitPolicy } from '../types'
import {
  resolveSpendingLimitDrawerState,
  type ActiveDrawerPolicy,
  type PendingTxOutcome,
  type Viewer,
} from './resolveState'

type SpendingLimitDrawerViewBaseProps = {
  open: boolean
  onClose: () => void
  viewer: Viewer
  safe: { address: string; name?: string }
  overview: Omit<PolicyOverviewProps, 'appliesTo' | 'chainId' | 'enforcedBy'> & { enforcedBy: string }
  names?: Record<string, string>
  onConnectWallet: () => void
  appliesToHref?: SafeHref
  enforcedByHref?: string
}

type ActiveSpendingLimitDrawerViewProps = SpendingLimitDrawerViewBaseProps & {
  policy: ActiveDrawerPolicy
  onEdit?: () => void
  onEnableModule?: () => void
}

type PendingSpendingLimitDrawerViewProps = SpendingLimitDrawerViewBaseProps & {
  policy: QueuedSpendingLimitPolicy
  transactionLink?: string
  reviewTransactionHref?: LinkProps['href']
  onRetry?: () => void
  outcome?: PendingTxOutcome
}

export type SpendingLimitDrawerViewProps = ActiveSpendingLimitDrawerViewProps | PendingSpendingLimitDrawerViewProps

const isPendingDrawer = (props: SpendingLimitDrawerViewProps): props is PendingSpendingLimitDrawerViewProps =>
  props.policy.status === 'pending'

export const SpendingLimitDrawerView = (props: SpendingLimitDrawerViewProps): ReactElement => {
  const { open, onClose, policy, viewer, safe, overview, names, onConnectWallet, appliesToHref, enforcedByHref } = props

  const outcome = isPendingDrawer(props) ? props.outcome : undefined
  const state = resolveSpendingLimitDrawerState(policy, viewer, safe.name ?? 'this Safe account', outcome)
  const Icon = getPolicyIcon(policy.type)
  // A queued transaction that left the queue is no longer pending; only an executed one is on its way.
  const status = outcome ? (outcome === 'executed' ? 'activating' : null) : getPolicyStatus(policy)
  const actions = isPendingDrawer(props)
    ? {
        pending: {
          transactionLink: props.transactionLink,
          reviewTransactionHref: props.reviewTransactionHref,
          onRetry: props.onRetry,
        },
      }
    : { onEdit: props.onEdit, onEnableModule: props.onEnableModule }

  return (
    <Drawer open={open} onClose={onClose} ariaLabel={getPolicyLabel(policy)}>
      <PolicyDrawerHeader icon={Icon} title={getPolicyLabel(policy)} status={status} />

      <DrawerBody>
        <div className="flex flex-col gap-6">
          {state.kind !== 'active' && <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />}
          {state.kind === 'pending' && (
            <PendingSignatures safe={safe} signed={state.signed} required={state.required} />
          )}
          <SpendingLimits spenders={policy.data.spenders} names={names} showUsage={state.kind === 'active'} />
          <PolicyOverview
            {...overview}
            appliesTo={{
              ...safe,
              href: appliesToHref,
            }}
            chainId={policy.safe.chainId}
            enforcedBy={state.kind === 'unenforced' ? undefined : { label: overview.enforcedBy, href: enforcedByHref }}
          />
        </div>
      </DrawerBody>

      <SpendingLimitActions state={state} onConnectWallet={onConnectWallet} {...actions} />
    </Drawer>
  )
}
