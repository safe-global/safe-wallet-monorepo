import type { ReactElement, ReactNode } from 'react'
import { Drawer, DrawerBody, DrawerHeader, DrawerTitle } from '@/components/common/Drawer'
import { Badge, BadgeDot } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { getPolicyIcon } from '../utils/policyIcon'
import { POLICY_TYPE_LABELS } from '../utils/policyLabel'
import type { AccountIdentityProps } from '../components/AccountIdentity'
import { PolicyDrawerActionsSkeleton } from '../components/PolicyDrawerActions'
import { PendingBanner } from './components/PendingBanner'
import { PendingSignatures } from './components/PendingSignatures'
import { PolicyOverview, PolicyOverviewSkeleton } from './components/PolicyOverview'
import { SpendingLimitActions } from './components/SpendingLimitActions'
import { SpendingLimits, SpendingLimitsSkeleton } from './components/SpendingLimits'
import { resolveSpendingLimitDrawerState, type DrawerPolicy, type Viewer } from './resolveState'

/** The drawer serves one policy type, so its icon and title do not have to wait for the policy. */
const TITLE = POLICY_TYPE_LABELS['spending-limit']
const Icon = getPolicyIcon('spending-limit')

export type SpendingLimitDrawerContentProps = {
  policy: DrawerPolicy
  viewer: Viewer
  safe: { address: string; name?: string }
  overview: {
    appliesTo: AccountIdentityProps
    /** Not supplied for spending limits — CGW returns no initiator. */
    initiatedBy?: AccountIdentityProps
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

export type SpendingLimitDrawerProps = {
  open: boolean
  onClose: () => void
  /** Absent while the policy is still being fetched, which is what the drawer renders skeletons for. */
  content?: SpendingLimitDrawerContentProps
}

const Header = ({ children }: { children: ReactNode }): ReactElement => (
  <DrawerHeader>
    <div className="flex size-10 items-center justify-center rounded-lg bg-success-subtle">
      <Icon className="size-4 text-success-strong" />
    </div>
    <DrawerTitle size="lg">{TITLE}</DrawerTitle>
    {children}
  </DrawerHeader>
)

const LoadingContent = (): ReactElement => (
  <>
    <Header>
      <Skeleton className="ml-auto h-6 w-24 rounded-lg" data-testid="spending-limit-status-skeleton" />
    </Header>

    <DrawerBody>
      <div className="flex flex-col gap-6">
        <SpendingLimitsSkeleton />
        <PolicyOverviewSkeleton />
      </div>
    </DrawerBody>

    <PolicyDrawerActionsSkeleton />
  </>
)

const DrawerContent = ({
  policy,
  viewer,
  safe,
  overview,
  names,
  ...actions
}: SpendingLimitDrawerContentProps): ReactElement => {
  const state = resolveSpendingLimitDrawerState(policy, viewer, safe.name ?? 'this Safe account')
  const isPending = state.kind === 'pending'

  return (
    <>
      <Header>
        <Badge variant={isPending ? 'warning' : 'success'} size="status" shape="status" className="ml-auto">
          <BadgeDot />
          {isPending ? 'Pending' : 'Active'}
        </Badge>
      </Header>

      <DrawerBody>
        <div className="flex flex-col gap-6">
          {isPending && <PendingBanner title={state.bannerTitle} line2={state.bannerLine2} />}
          {isPending && <PendingSignatures safe={safe} signed={state.signed} required={state.required} />}
          <SpendingLimits spenders={policy.data.spenders} names={names} showUsage={!isPending} />
          <PolicyOverview {...overview} />
        </div>
      </DrawerBody>

      <SpendingLimitActions state={state} {...actions} />
    </>
  )
}

const SpendingLimitDrawer = ({ open, onClose, content }: SpendingLimitDrawerProps): ReactElement => (
  <Drawer open={open} onClose={onClose} ariaLabel={TITLE}>
    {content ? <DrawerContent {...content} /> : <LoadingContent />}
  </Drawer>
)

export default SpendingLimitDrawer
