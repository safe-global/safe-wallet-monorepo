import type { PropsWithChildren, ReactElement } from 'react'
import { RecoveryFeature } from '@/features/recovery'
import type { RecoveryQueueItem } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'

export function CancelRecoveryFlowReview({
  recovery,
  onSubmit,
  children,
}: PropsWithChildren<{
  recovery: RecoveryQueueItem
  onSubmit: () => void
}>): ReactElement | null {
  const { CancelRecoveryReview } = useLoadFeature(RecoveryFeature)

  return (
    <CancelRecoveryReview recovery={recovery} onSubmit={onSubmit}>
      {children}
    </CancelRecoveryReview>
  )
}
