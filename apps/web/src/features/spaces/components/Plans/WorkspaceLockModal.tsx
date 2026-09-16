import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { highlightSafePro } from '@/components/common/ProHighlight'
import { useLoadFeature } from '@/features/__core__'
import { SafeProFeature } from '@/features/safe-pro-announcement'
import { useCurrentMembership, useIsAdmin } from '../../hooks/useSpaceMembers'
import { useWorkspaceLock, type WorkspaceLockReason } from '../../hooks/useWorkspaceLock'
import { claimCopy } from './ClaimTrialModal'
import ClaimTrialModal from './ClaimTrialModal'
import PlanChooserModal, { chooserCopy } from './PlanChooserModal'

export const memberCopy = (
  reason: WorkspaceLockReason,
  trialPeriodDays: number | null,
  endedAt: number | null,
  spaceName: string,
): { title: string; body: string } => {
  if (reason === 'trial-offered') {
    return {
      title: claimCopy(trialPeriodDays).title,
      body: `${spaceName} is locked until an admin starts the free trial. Your Safe accounts remain available outside the Workspace.`,
    }
  }
  return {
    title: reason === 'payment-failed' ? 'Your Workspace’s last payment failed' : chooserCopy(reason, endedAt).title,
    body: 'An admin needs to choose a plan to unlock it. Your Safe accounts remain available outside the Workspace.',
  }
}

/**
 * Mounted on every Workspace page: while the Workspace has no live plan it blocks the page behind the trial offer,
 * the plan picker or, for non-admins, an explanation. Only the Plans page lets an admin dismiss the picker.
 */
export default function WorkspaceLockModal({ spaceId }: { spaceId: string }) {
  const router = useRouter()
  const { isLocked, reason, endedAt, trialPeriodDays } = useWorkspaceLock(spaceId)
  const membership = useCurrentMembership(spaceId)
  const isAdmin = useIsAdmin(spaceId)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId }, { skip: !isLocked })
  const { SafeProNoticeModal } = useLoadFeature(SafeProFeature)
  const [dismissed, setDismissed] = useState(false)
  const canDismiss = router.pathname === AppRoutes.spaces.plans

  // Without the membership the admin check cannot be trusted yet; a non-member never gets this far (AuthState).
  if (!isLocked || !membership || (dismissed && canDismiss)) return null

  const goBack = () => void router.push(AppRoutes.welcome.accounts)

  if (!isAdmin) {
    const { title, body } = memberCopy(reason, trialPeriodDays, endedAt, space?.name ?? 'This Workspace')
    return <SafeProNoticeModal open title={highlightSafePro(title)} body={body} onAction={goBack} />
  }

  if (reason === 'trial-offered') return <ClaimTrialModal spaceId={spaceId} onBack={goBack} />

  return (
    <PlanChooserModal
      spaceId={spaceId}
      reason={reason}
      endedAt={endedAt}
      onBack={goBack}
      onDismiss={canDismiss ? () => setDismissed(true) : undefined}
    />
  )
}
