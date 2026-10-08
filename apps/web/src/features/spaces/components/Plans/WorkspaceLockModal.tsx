import { useRouter } from 'next/router'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import { useCheckoutReturn, type CheckoutReturnStatus } from '../../hooks/billing/useCheckoutReturn'
import { useCurrentMembership, useIsAdmin } from '../../hooks/useSpaceMembers'
import { useWorkspaceLock, type WorkspaceLockReason } from '../../hooks/useWorkspaceLock'
import ClaimTrialModal from './ClaimTrialModal'
import PlanChooserModal from './PlanChooserModal'
import {
  MemberLockedNoticeView,
  WorkspaceLockModalView,
} from '@views/features/spaces/components/Plans/WorkspaceLockModalView'

export { _memberCopy, _PLAN_ERROR_COPY } from '@views/features/spaces/components/Plans/WorkspaceLockModalView'

// Statuses in which the checkout modals give the screen back to the lock.
const CHECKOUT_RELEASED_STATUSES: CheckoutReturnStatus[] = ['error', 'timeout', 'canceled']

/** A member cannot act on a lapsed or failed plan; the notice is the whole of the locked flow for them. */
const MemberLockedNotice = ({
  reason,
  trialPeriodDays,
  endedAt,
  spaceName,
  onBack,
}: {
  reason: WorkspaceLockReason
  trialPeriodDays: number | null
  endedAt: number | null
  spaceName?: string
  onBack: () => void
}) => {
  const isPlanLock = reason !== 'trial-offered'
  useTrackOnce(SAFE_PRO_EVENTS.WORKSPACE_LOCKED_VIEWED, undefined, isPlanLock)

  return (
    <MemberLockedNoticeView
      reason={reason}
      trialPeriodDays={trialPeriodDays}
      endedAt={endedAt}
      spaceName={spaceName}
      onBack={onBack}
    />
  )
}

/** Mounted on every Workspace page; none of the modals it shows can be dismissed. */
export default function WorkspaceLockModal({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const { isLocked, isError, retry, reason, endedAt, trialPeriodDays } = useWorkspaceLock(spaceId)
  const membership = useCurrentMembership(spaceId)
  const isAdmin = useIsAdmin(spaceId)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId }, { skip: !isLocked })
  // Back from a completed Stripe checkout the subscription is still propagating: the checkout modals own the screen
  // until it fails. An abandoned checkout (Back) changed nothing, so the lock shows again right away.
  const checkout = useCheckoutReturn(spaceId)
  const isConfirmingCheckout = checkout.isReturning && !CHECKOUT_RELEASED_STATUSES.includes(checkout.status)

  // Without the membership the admin check cannot be trusted yet; a non-member never gets this far (AuthState).
  if (!membership || isConfirmingCheckout) return null

  const goBack = () => void router.push(AppRoutes.welcome.accounts)

  if (isError) return <WorkspaceLockModalView onBack={goBack} onRetry={retry} />

  if (!isLocked) return null

  if (!isAdmin) {
    return (
      <MemberLockedNotice
        reason={reason}
        trialPeriodDays={trialPeriodDays}
        endedAt={endedAt}
        spaceName={space?.name}
        onBack={goBack}
      />
    )
  }

  if (reason === 'trial-offered') return <ClaimTrialModal spaceId={spaceId} onBack={goBack} />

  return <PlanChooserModal spaceId={spaceId} reason={reason} endedAt={endedAt} onBack={goBack} />
}
