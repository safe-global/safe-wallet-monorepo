import type { ReactElement } from 'react'
import { AppRoutes } from '@/config/routes'
import { formatDate } from '@safe-global/utils/utils/date'
import { highlightSafePro } from '@/components/common/ProHighlight'
import type { WorkspaceLockReason } from '@/features/spaces/hooks/useWorkspaceLock'
import { SafeProNoticeModal } from '../SafeProModals'
import { claimCopy } from './ClaimTrialModalView'
import { chooserCopy } from './PlanChooserModalView'

export const _memberCopy = (
  reason: WorkspaceLockReason,
  trialPeriodDays: number | null,
  endedAt: number | null,
  spaceName: string,
): { title: string; body: string } => {
  if (reason === 'trial-offered') {
    return {
      title: claimCopy(trialPeriodDays).title,
      body: `${spaceName} is locked until an admin claims free access. Your Safe accounts remain available in My accounts.`,
    }
  }
  return {
    title:
      reason === 'payment-failed'
        ? 'Your Workspace’s last payment failed'
        : reason === 'lapsed' && endedAt !== null
          ? `Your free access ended on ${formatDate(endedAt)}`
          : chooserCopy(reason, endedAt).title,
    body: 'An admin needs to choose a plan to unlock your Workspace.\nYour Safe accounts remain available in My accounts.',
  }
}

export const _PLAN_ERROR_COPY = {
  title: 'Your plan could not be checked',
  body: 'We could not load the plan of this Workspace. Try again, or come back later, your Safe accounts remain available in My accounts.',
}

export type MemberLockedNoticeViewProps = {
  reason: WorkspaceLockReason
  trialPeriodDays: number | null
  endedAt: number | null
  spaceName?: string
  onBack: () => void
}

/** A member cannot act on a lapsed or failed plan; the notice is the whole of the locked flow for them. */
export const MemberLockedNoticeView = ({
  reason,
  trialPeriodDays,
  endedAt,
  spaceName,
  onBack,
}: MemberLockedNoticeViewProps): ReactElement => {
  const { title, body } = _memberCopy(reason, trialPeriodDays, endedAt, spaceName ?? 'This Workspace')

  return (
    <SafeProNoticeModal
      open
      title={highlightSafePro(title)}
      body={body}
      onAction={onBack}
      secondaryActionLabel={reason === 'lapsed' ? 'Create new Workspace' : undefined}
      secondaryActionHref={reason === 'lapsed' ? AppRoutes.welcome.spaces : undefined}
    />
  )
}

export type WorkspaceLockModalViewProps = {
  onBack: () => void
  onRetry: () => void
}

/** The plan could not be read, so the lock cannot be decided yet. */
export const WorkspaceLockModalView = ({ onBack, onRetry }: WorkspaceLockModalViewProps): ReactElement => (
  <SafeProNoticeModal
    open
    title={_PLAN_ERROR_COPY.title}
    body={_PLAN_ERROR_COPY.body}
    actionLabel="Back to My accounts"
    onAction={onBack}
    secondaryActionLabel="Try again"
    onSecondaryAction={onRetry}
  />
)
