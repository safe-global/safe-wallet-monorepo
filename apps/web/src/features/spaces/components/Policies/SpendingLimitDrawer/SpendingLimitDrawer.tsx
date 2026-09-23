import type { ReactElement } from 'react'
import { Drawer, DrawerBody, DrawerHeader, DrawerTitle } from '@/components/common/Drawer'
import { Badge, BadgeDot } from '@/components/ui/badge'
import { getPolicyIcon } from '../utils/policyIcon'
import { getPolicyLabel } from '../utils/policyLabel'
import type { AccountIdentityProps } from '../components/AccountIdentity'
import { PendingBanner } from './components/PendingBanner'
import { PendingSignatures } from './components/PendingSignatures'
import { PolicyOverview } from './components/PolicyOverview'
import { SpendingLimitActions } from './components/SpendingLimitActions'
import { SpendingLimits } from './components/SpendingLimits'
import { resolveSpendingLimitDrawerState, type DrawerPolicy, type Viewer } from './resolveState'

export type SpendingLimitDrawerProps = {
  open: boolean
  onClose: () => void
  policy: DrawerPolicy
  viewer: Viewer
  safe: { address: string; name?: string }
  overview: {
    appliesTo: AccountIdentityProps
    initiatedBy: AccountIdentityProps
    lastUpdated: string
    enforcedBy: string
  }
  names?: Record<string, string>
  transactionLink: string
  onEdit: () => void
  onDelete: () => void
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
        <Badge variant={isPending ? 'warning' : 'success'} size="status" shape="status" className="ml-auto">
          <BadgeDot />
          {isPending ? 'Pending' : 'Active'}
        </Badge>
      </DrawerHeader>

      <DrawerBody>
        <div className="flex flex-col gap-6">
          {isPending && <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />}
          {isPending && <PendingSignatures safe={safe} signed={state.signed} required={state.required} />}
          <SpendingLimits spenders={policy.data.spenders} names={names} showUsage={!isPending} />
          <PolicyOverview {...overview} />
        </div>
      </DrawerBody>

      <SpendingLimitActions state={state} {...actions} />
    </Drawer>
  )
}

export default SpendingLimitDrawer
