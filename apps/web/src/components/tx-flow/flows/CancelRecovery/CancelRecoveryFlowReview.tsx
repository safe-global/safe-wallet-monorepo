import type { PropsWithChildren, ReactElement } from 'react'
import CancelRecoveryReview from '@/features/recovery/public/components/CancelRecoveryReview'
import type { RecoveryQueueItem } from '@/features/recovery/public/types'

export function CancelRecoveryFlowReview({
  recovery,
  onSubmit,
  children,
}: PropsWithChildren<{
  recovery: RecoveryQueueItem
  onSubmit: () => void
}>): ReactElement | null {
  return (
    <CancelRecoveryReview recovery={recovery} onSubmit={onSubmit}>
      {children}
    </CancelRecoveryReview>
  )
}
