import type { ReactElement } from 'react'
import { RecoveryFeature } from '@/features/recovery'
import { useLoadFeature } from '@/features/__core__'
import type { RecoverAccountFlowProps } from '.'
import { RecoverAccountFlowFields } from '.'

export function RecoverAccountFlowReview({ params }: { params: RecoverAccountFlowProps }): ReactElement | null {
  const { RecoverAccountReview } = useLoadFeature(RecoveryFeature)

  return (
    <RecoverAccountReview
      threshold={params[RecoverAccountFlowFields.threshold]}
      owners={params[RecoverAccountFlowFields.owners]}
    />
  )
}
