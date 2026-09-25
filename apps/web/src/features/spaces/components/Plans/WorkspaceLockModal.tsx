import { useRouter } from 'next/router'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { SafeProNoticeModal } from '../SafeProModals'
import { useCheckoutReturn } from '../../hooks/billing/useCheckoutReturn'
import { useCurrentMembership, useIsAdmin } from '../../hooks/useSpaceMembers'
import { useWorkspaceLock, type WorkspaceLockReason } from '../../hooks/useWorkspaceLock'
import { claimCopy } from './ClaimTrialModal'
import ClaimTrialModal from './ClaimTrialModal'
import PlanChooserModal, { chooserCopy } from './PlanChooserModal'

export const _memberCopy = (
  reason: WorkspaceLockReason,
  trialPeriodDays: number | null,
  endedAt: number | null,
  spaceName: string,
): { title: string; body: string } => {
  if (reason === 'trial-offered') {
    return {
      title: claimCopy(trialPeriodDays).title,
      body: `${spaceName} is locked until an admin starts the free access. Your Safe accounts remain available outside the Workspace.`,
    }
  }
  return {
    title: reason === 'payment-failed' ? 'Your Workspace’s last payment failed' : chooserCopy(reason, endedAt).title,
    body: 'An admin needs to choose a plan to unlock it. Your Safe accounts remain available outside the Workspace.',
  }
}

export const _PLAN_ERROR_COPY = {
  title: 'Your plan could not be checked',
  body: 'We could not load the plan of this Workspace. Try again, or come back later, your Safe accounts remain available outside the Workspace.',
}

/** Mounted on every Workspace page; none of the modals it shows can be dismissed. */
export default function WorkspaceLockModal({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const { isLocked, isError, retry, reason, endedAt, trialPeriodDays } = useWorkspaceLock(spaceId)
  const membership = useCurrentMembership(spaceId)
  const isAdmin = useIsAdmin(spaceId)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId }, { skip: !isLocked })
  // Back from Stripe the subscription is still propagating: the checkout modals own the screen until it fails.
  const checkout = useCheckoutReturn(spaceId)
  const isConfirmingCheckout = checkout.isReturning && checkout.status !== 'error' && checkout.status !== 'timeout'

  // Without the membership the admin check cannot be trusted yet; a non-member never gets this far (AuthState).
  if (!membership || isConfirmingCheckout) return null

  const goBack = () => void router.push(AppRoutes.welcome.accounts)

  if (isError) {
    return (
      <SafeProNoticeModal
        open
        title={_PLAN_ERROR_COPY.title}
        body={_PLAN_ERROR_COPY.body}
        actionLabel="Back to My accounts"
        onAction={goBack}
        secondaryActionLabel="Try again"
        onSecondaryAction={retry}
      />
    )
  }

  if (!isLocked) return null

  if (!isAdmin) {
    const { title, body } = _memberCopy(reason, trialPeriodDays, endedAt, space?.name ?? 'This Workspace')
    return (
      <SafeProNoticeModal
        open
        title={highlightSafePro(title)}
        body={body}
        onAction={goBack}
        secondaryActionLabel={reason === 'lapsed' ? 'Create new Workspace' : undefined}
        secondaryActionHref={reason === 'lapsed' ? AppRoutes.welcome.spaces : undefined}
      />
    )
  }

  if (reason === 'trial-offered') return <ClaimTrialModal spaceId={spaceId} onBack={goBack} />

  return <PlanChooserModal spaceId={spaceId} reason={reason} endedAt={endedAt} onBack={goBack} />
}
